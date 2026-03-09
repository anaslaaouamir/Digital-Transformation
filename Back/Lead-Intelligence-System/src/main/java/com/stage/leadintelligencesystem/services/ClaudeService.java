package com.stage.leadintelligencesystem.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private final LeadRepository leadRepository;
    private final InteractionRepository interactionRepository;
    @Value("${app.tracking.url}")
    private String trackingBaseUrl;
    @Value("${n8n.for.whatsap}")
    private String n8n_public;

    public ClaudeService(LeadRepository leadRepository, InteractionRepository interactionRepository) {
        this.leadRepository = leadRepository;
        this.interactionRepository = interactionRepository;
    }

    @Transactional
    public SimulatedEmailDto generateAndSendClaudeEmail(String email, String userPrompt) {
        // 1. Fetch the lead
        Lead lead = leadRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + email));



        // 3. Create the interaction (Starts as SENT)
        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("EMAIL");
        interaction.setType("AI_GENERATED");
        interaction.setStatus("SENT");
        interaction.setSentAt(LocalDateTime.now());

        // Save to get the database ID for the pixel
        interaction = interactionRepository.save(interaction);

        // 4. Generate the Tracking Pixel
        String trackingUrl = trackingBaseUrl + "/api/tracking/open/" + interaction.getId();
        String pixelHtml = "<img src=\"" + trackingUrl + "\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\"/>";

        // 5. Prepare the payload for n8n
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", lead.getEmail()); // Explicitly pass email for the Gmail node
        payload.put("lead", lead);
        payload.put("userPrompt", userPrompt);
        payload.put("pixelHtml", pixelHtml);

        RestTemplate restTemplate = new RestTemplate();
        String n8nWebhookUrl = "http://localhost:5678/webhook/generate_email";

        try {
            // 6. Call n8n. Wait for the response.
            String n8nResponseStr = restTemplate.postForObject(n8nWebhookUrl, payload, String.class);

            // 7. Parse Claude's generated Subject and Body from n8n's JSON response
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(n8nResponseStr);
            String generatedSubject = root.path("subject").asText();
            String generatedBody = root.path("body").asText();

            // 8. Update the interaction with actual generated content + pixel
            String finalBody = generatedBody + "<br>" + pixelHtml;
            interaction.setSubject(generatedSubject);
            interaction.setContent(finalBody);
            interactionRepository.save(interaction);

            // 9. Update Lead Status (Only if not in sequence!)
            if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
                lead.setContactStatus("AI_EMAIL_ENVOYE");
                leadRepository.save(lead);
            }

            return new SimulatedEmailDto(lead.getId(), lead.getEmail(), generatedSubject, finalBody);

        } catch (Exception e) {
            // 10. n8n or Gmail failed -> Wipe the interaction to restore original state
            interactionRepository.delete(interaction);
            throw new RuntimeException("Failed to generate or send AI email: " + e.getMessage());
        }
    }

    @Transactional
    public SimulatedWhatsAppDto generateAndSendClaudeWhatsapp(String phoneNumber, String userPrompt) {
        // 1. Fetch the lead by phone number (ensure this method exists in LeadRepository!)
        Lead lead = leadRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("Lead not found with phone: " + phoneNumber));

        // 2. Create the interaction (Starts as SENT)
        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("WHATSAPP"); // Updated channel
        interaction.setType("AI_GENERATED");
        interaction.setStatus("SENT");
        interaction.setSentAt(LocalDateTime.now());

        interaction = interactionRepository.save(interaction);

        // 3. Prepare the payload for n8n (No pixel needed)
        Map<String, Object> payload = new HashMap<>();
        payload.put("phoneNumber", phoneNumber);
        payload.put("lead", lead);
        payload.put("userPrompt", userPrompt);

        RestTemplate restTemplate = new RestTemplate();
        // Pointing to your specific ngrok webhook for WhatsApp
        String n8nWebhookUrl = n8n_public+"/webhook/generate_whatsap_msg";

        try {
            // 4. Call n8n. Wait for the response.
            String n8nResponseStr = restTemplate.postForObject(n8nWebhookUrl, payload, String.class);

            // 5. Parse Claude's generated message from n8n's JSON response
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(n8nResponseStr);

            // Extract the 'message' field that we set up in the n8n "Edit Fields" node
            String generatedMessage = root.path("message").asText();

            // 6. Update the interaction with actual generated content
            interaction.setContent(generatedMessage);
            interactionRepository.save(interaction);

            // 7. Update Lead Status (Only if not in sequence)
            if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
                lead.setContactStatus("AI_WHATSAPP_ENVOYE"); // Custom status for WA
                leadRepository.save(lead);
            }

            return new SimulatedWhatsAppDto(lead.getId(), lead.getPhoneNumber(), generatedMessage);

        } catch (Exception e) {
            // 8. n8n or WhatsApp failed -> Wipe the interaction to restore original state
            interactionRepository.delete(interaction);
            throw new RuntimeException("Failed to generate or send AI WhatsApp: " + e.getMessage());
        }
    }
}