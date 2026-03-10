package com.stage.leadintelligencesystem.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stage.leadintelligencesystem.dto.ClaudeGenerateDto;
import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.dto.SimulatedWhatsAppDto;
import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.repositories.InteractionRepository;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class ClaudeService {

    private final LeadRepository        leadRepository;
    private final InteractionRepository interactionRepository;

    @Value("${app.tracking.url}")
    private String trackingBaseUrl;

    @Value("${n8n.for.whatsap}")
    private String n8n_public;

    public ClaudeService(LeadRepository leadRepository,
                         InteractionRepository interactionRepository) {
        this.leadRepository        = leadRepository;
        this.interactionRepository = interactionRepository;
    }

    // ══════════════════════════════════════════════════════════════
    // PREVIEW ONLY — no DB write, no email/WA sent
    // ══════════════════════════════════════════════════════════════

    public ClaudeGenerateDto generateOnly(String email,
                                          String phone,
                                          String userPrompt,
                                          String channel) {

        // ── Validate inputs before doing anything ──
        boolean needsEmail = "email".equals(channel) || "both".equals(channel);
        boolean needsPhone = "whatsapp".equals(channel) || "both".equals(channel);

        if (needsEmail && (email == null || email.isBlank())) {
            throw new RuntimeException("Email is required for channel: " + channel);
        }
        if (needsPhone && (phone == null || phone.isBlank())) {
            throw new RuntimeException("Phone number is required for channel: " + channel);
        }

        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper mapper       = new ObjectMapper();

        String generatedSubject = null;
        String generatedBody    = null;
        String generatedWaBody  = null;

        // ── Email branch ──
        if (needsEmail) {
            Lead lead = leadRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("No lead found with email: " + email));

            Map<String, Object> payload = new HashMap<>();
            payload.put("email",      lead.getEmail());
            payload.put("lead",       lead);
            payload.put("userPrompt", userPrompt);
            payload.put("pixelHtml",  ""); // no pixel for preview

            try {
                String n8nUrl      = "http://localhost:5678/webhook/generate_email";
                String responseStr = restTemplate.postForObject(n8nUrl, payload, String.class);

                JsonNode root    = mapper.readTree(responseStr);
                generatedSubject = root.path("subject").asText();
                generatedBody    = root.path("body").asText();
            } catch (Exception e) {
                throw new RuntimeException("Email generation failed: " + e.getMessage());
            }
        }

        // ── WhatsApp branch ──
        if (needsPhone) {
            Lead lead = leadRepository.findByPhoneNumber(phone)
                    .orElseThrow(() -> new RuntimeException("No lead found with phone: " + phone));

            Map<String, Object> payload = new HashMap<>();
            payload.put("phoneNumber", phone);
            payload.put("lead",        lead);
            payload.put("userPrompt",  userPrompt);

            try {
                String n8nUrl      = n8n_public + "/webhook/generate_whatsap_msg";
                String responseStr = restTemplate.postForObject(n8nUrl, payload, String.class);

                JsonNode root   = mapper.readTree(responseStr);
                generatedWaBody = root.path("message").asText();
            } catch (Exception e) {
                throw new RuntimeException("WhatsApp generation failed: " + e.getMessage());
            }
        }

        return new ClaudeGenerateDto(generatedSubject, generatedBody, generatedWaBody);
    }

    // ══════════════════════════════════════════════════════════════
    // GENERATE + SEND EMAIL
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public SimulatedEmailDto generateAndSendClaudeEmail(String email, String userPrompt) {

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        Lead lead = leadRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No lead found with email: " + email));

        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("EMAIL");
        interaction.setType("AI_GENERATED");
        interaction.setStatus("SENT");
        interaction.setSentAt(LocalDateTime.now());
        interaction = interactionRepository.save(interaction);

        String trackingUrl = trackingBaseUrl + "/api/tracking/open/" + interaction.getId();
        String pixelHtml   = "<img src=\"" + trackingUrl + "\" width=\"1\" height=\"1\" "
                           + "alt=\"\" style=\"display:none;\"/>";

        Map<String, Object> payload = new HashMap<>();
        payload.put("email",      lead.getEmail());
        payload.put("lead",       lead);
        payload.put("userPrompt", userPrompt);
        payload.put("pixelHtml",  pixelHtml);

        RestTemplate restTemplate  = new RestTemplate();
        String       n8nWebhookUrl = "http://localhost:5678/webhook/generate_email";

        try {
            String   responseStr      = restTemplate.postForObject(n8nWebhookUrl, payload, String.class);
            JsonNode root             = new ObjectMapper().readTree(responseStr);
            String   generatedSubject = root.path("subject").asText();
            String   generatedBody    = root.path("body").asText();

            String finalBody = generatedBody + "<br>" + pixelHtml;
            interaction.setSubject(generatedSubject);
            interaction.setContent(finalBody);
            interactionRepository.save(interaction);

            if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
                lead.setContactStatus("AI_EMAIL_ENVOYE");
                leadRepository.save(lead);
            }

            return new SimulatedEmailDto(lead.getId(), lead.getEmail(), generatedSubject, finalBody);

        } catch (Exception e) {
            interactionRepository.delete(interaction);
            throw new RuntimeException("Failed to generate or send AI email: " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════
    // GENERATE + SEND WHATSAPP
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public SimulatedWhatsAppDto generateAndSendClaudeWhatsapp(String phoneNumber, String userPrompt) {

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new RuntimeException("Phone number is required");
        }

        Lead lead = leadRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("No lead found with phone: " + phoneNumber));

        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("WHATSAPP");
        interaction.setType("AI_GENERATED");
        interaction.setStatus("SENT");
        interaction.setSentAt(LocalDateTime.now());
        interaction = interactionRepository.save(interaction);

        Map<String, Object> payload = new HashMap<>();
        payload.put("phoneNumber", phoneNumber);
        payload.put("lead",        lead);
        payload.put("userPrompt",  userPrompt);

        RestTemplate restTemplate  = new RestTemplate();
        String       n8nWebhookUrl = n8n_public + "/webhook/generate_whatsap_msg";

        try {
            String   responseStr      = restTemplate.postForObject(n8nWebhookUrl, payload, String.class);
            JsonNode root             = new ObjectMapper().readTree(responseStr);
            String   generatedMessage = root.path("message").asText();

            interaction.setContent(generatedMessage);
            interactionRepository.save(interaction);

            if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
                lead.setContactStatus("AI_WHATSAPP_ENVOYE");
                leadRepository.save(lead);
            }

            return new SimulatedWhatsAppDto(lead.getId(), lead.getPhoneNumber(), generatedMessage);

        } catch (Exception e) {
            interactionRepository.delete(interaction);
            throw new RuntimeException("Failed to generate or send AI WhatsApp: " + e.getMessage());
        }
    }
}