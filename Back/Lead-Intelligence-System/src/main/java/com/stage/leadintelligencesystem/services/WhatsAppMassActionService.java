package com.stage.leadintelligencesystem.services;

import com.stage.leadintelligencesystem.dto.SimulatedWhatsAppDto;
import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.entities.MessageTemplate;
import com.stage.leadintelligencesystem.entities.SequenceEnrollment;
import com.stage.leadintelligencesystem.repositories.InteractionRepository;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import com.stage.leadintelligencesystem.repositories.MessageTemplateRepository;
import com.stage.leadintelligencesystem.repositories.SequenceEnrollmentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class WhatsAppMassActionService {

    private final LeadRepository leadRepository;
    private final InteractionRepository interactionRepository;
    private final MessageTemplateRepository templateRepository;
    private final SequenceEnrollmentRepository enrollmentRepository;

    @Value("${n8n.for.whatsap}")
    private String n8nPublic;

    public WhatsAppMassActionService(
            LeadRepository leadRepository,
            InteractionRepository interactionRepository,
            MessageTemplateRepository templateRepository,
            SequenceEnrollmentRepository enrollmentRepository) {
        this.leadRepository = leadRepository;
        this.interactionRepository = interactionRepository;
        this.templateRepository = templateRepository;
        this.enrollmentRepository = enrollmentRepository;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // MASS SEND
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public List<SimulatedWhatsAppDto> simulateMassWhatsApp() {
        List<SimulatedWhatsAppDto> generatedMessages = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // 1. Fetch template
        MessageTemplate template = templateRepository.findByName("Première approche")
                .orElseThrow(() -> new RuntimeException(
                        "Template 'Première approche' not found. Please seed it in the DB."));

        if (template.getBody() == null || template.getBody().isBlank()) {
            throw new RuntimeException("Template 'Première approche' has an empty body.");
        }

        // 2. Fetch leads
        List<Lead> leadsToProcess;

            leadsToProcess = leadRepository.findByTemperatureAndContactStatusAndPhoneNumberIsNotNull(
                    "HOT", "NON_CONTACTE");


        System.out.println("[WhatsApp] Starting mass send for " + leadsToProcess.size() + " leads.");
        System.out.println("[WhatsApp] n8n URL: " + n8nPublic + "/webhook/send_message");

        // 3. Process each lead
        for (Lead lead : leadsToProcess) {
            String rawPhone = lead.getPhoneNumber();

            if (rawPhone == null || rawPhone.isBlank()) {
                System.err.println("[WhatsApp] SKIP leadId=" + lead.getId() + " — phone is null/blank.");
                errors.add("Lead " + lead.getId() + ": no phone number");
                continue;
            }



            String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isBlank())
                    ? lead.getCompanyName()
                    : "votre entreprise";

            String personalizedBody = template.getBody().replace("{{company}}", companyName);

            // Save interaction optimistically
            Interaction interaction = new Interaction();
            interaction.setLead(lead);
            interaction.setChannel("WHATSAPP");
            interaction.setType("MASSE");
            interaction.setStatus("SENT");
            interaction.setContent(personalizedBody);
            interaction.setSentAt(LocalDateTime.now());
            interaction = interactionRepository.save(interaction);

            // Attempt n8n call
            try {
                forwardToN8nWhatsApp(lead.getPhoneNumber(), personalizedBody);

                lead.setContactStatus("MASS_WHATSAPP_ENVOYE");
                leadRepository.save(lead);

                generatedMessages.add(new SimulatedWhatsAppDto(
                        lead.getId(), lead.getPhoneNumber(), personalizedBody));

                System.out.println("[WhatsApp] SUCCESS leadId=" + lead.getId());

            } catch (Exception e) {
                interaction.setStatus("BOUNCED");
                interactionRepository.save(interaction);

                lead.setContactStatus("BOUNCED_PHONENUMBER");
                leadRepository.save(lead);

                String reason = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                errors.add("Lead " + lead.getId() + " (" + lead.getPhoneNumber() + "): " + reason);
                System.err.println("[WhatsApp] FAILED leadId=" + lead.getId()
                        + " phone=" + lead.getPhoneNumber()
                        + " reason=" + reason);
            }
        }

        // All failed → throw with detail
        if (!leadsToProcess.isEmpty() && generatedMessages.isEmpty()) {
            String detail = String.join(" | ", errors.stream().limit(5).toList());
            throw new RuntimeException(
                    "WhatsApp mass send failed entirely. Attempted " + leadsToProcess.size()
                    + " leads — all bounced. First errors: " + detail);
        }

        System.out.println("[WhatsApp] Done. Sent=" + generatedMessages.size()
                + " Failed=" + errors.size());
        return generatedMessages;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANUAL SEND
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public SimulatedWhatsAppDto sendManualWhatsApp(SimulatedWhatsAppDto request) {
        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            throw new RuntimeException("phoneNumber is required.");
        }

        Lead lead = leadRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new RuntimeException(
                        "Lead not found with phone number: " + request.getPhoneNumber()));

        String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isBlank())
                ? lead.getCompanyName()
                : "votre entreprise";

        String personalizedBody = (request.getBody() != null ? request.getBody() : "")
                .replace("{{company}}", companyName);


        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("WHATSAPP");
        interaction.setType("MANUAL");
        interaction.setStatus("SENT");
        interaction.setContent(personalizedBody);
        interaction.setSentAt(LocalDateTime.now());
        interactionRepository.save(interaction);

        if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
            lead.setContactStatus("MANUAL_WHATSAPP_ENVOYE");
            leadRepository.save(lead);
        }

        forwardToN8nWhatsApp(lead.getPhoneNumber(), personalizedBody);

        return new SimulatedWhatsAppDto(lead.getId(), lead.getPhoneNumber(), personalizedBody);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INCOMING WEBHOOK
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void processIncomingWhatsApp(Map<String, String> payload) {
        String phoneNumber  = payload.get("phoneNumber");
        String message      = payload.get("message");
        String timestampStr = payload.get("timestamp");

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new RuntimeException("Missing 'phoneNumber' in webhook payload.");
        }
        if (message == null || message.isBlank()) {
            throw new RuntimeException("Missing 'message' in webhook payload.");
        }

        LocalDateTime repliedAtTime = LocalDateTime.now();
        if (timestampStr != null && !timestampStr.isBlank()) {
            try {
                long unixSeconds = Long.parseLong(timestampStr.trim());
                repliedAtTime = LocalDateTime.ofInstant(
                        Instant.ofEpochSecond(unixSeconds), ZoneId.systemDefault());
            } catch (NumberFormatException e) {
                System.err.println("[WhatsApp] Could not parse timestamp: " + timestampStr);
            }
        }

        Lead lead = leadRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException(
                        "Lead not found with phone number: " + phoneNumber));

        if (!"A_REPONDU".equals(lead.getContactStatus())) {
            lead.setContactStatus("A_REPONDU");
            leadRepository.save(lead);
        }

        Optional<SequenceEnrollment> activeEnrollment =
                enrollmentRepository.findByLeadAndStatus(lead, "ACTIVE");
        if (activeEnrollment.isPresent()) {
            SequenceEnrollment enrollment = activeEnrollment.get();
            enrollment.setStatus("CANCELLED");
            enrollment.setNextExecutionDate(null);
            enrollmentRepository.save(enrollment);
        }

        List<Interaction> previousMessages =
                interactionRepository.findByLeadAndChannelAndStatusInOrderBySentAtDesc(
                        lead, "WHATSAPP", List.of("SENT"));

        if (!previousMessages.isEmpty()) {
            Interaction mostRecent = previousMessages.get(0);
            mostRecent.setStatus("REPLIED");
            mostRecent.setRepliedAt(repliedAtTime);
            mostRecent.setOpenedAt(repliedAtTime);
            interactionRepository.save(mostRecent);

            for (int i = 1; i < previousMessages.size(); i++) {
                Interaction older = previousMessages.get(i);
                if (!"OPENED".equals(older.getStatus())) {
                    older.setStatus("OPENED");
                    if (older.getOpenedAt() == null) {
                        older.setOpenedAt(repliedAtTime);
                    }
                    interactionRepository.save(older);
                }
            }
        }

        Interaction responseInteraction = new Interaction();
        responseInteraction.setLead(lead);
        responseInteraction.setChannel("WHATSAPP");
        responseInteraction.setType("RESPONSE");
        responseInteraction.setStatus("RECEIVED");
        responseInteraction.setContent(message);
        responseInteraction.setSentAt(repliedAtTime);
        interactionRepository.save(responseInteraction);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER — forward to n8n with detailed error reporting
    // ─────────────────────────────────────────────────────────────────────────
    private void forwardToN8nWhatsApp(String phoneNumber, String message) {
        RestTemplate restTemplate = new RestTemplate();
        String webhookUrl = n8nPublic + "/webhook/send_message";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> payload = new HashMap<>();
        payload.put("phoneNumber", phoneNumber);
        payload.put("message", message);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

        try {
            restTemplate.postForObject(webhookUrl, entity, String.class);

        } catch (HttpClientErrorException e) {
            // 4xx from n8n — bad request, wrong format, etc.
            throw new RuntimeException(
                    "n8n rejected request (HTTP " + e.getStatusCode() + "): " + e.getResponseBodyAsString());

        } catch (HttpServerErrorException e) {
            // 5xx from n8n — n8n workflow error
            throw new RuntimeException(
                    "n8n workflow error (HTTP " + e.getStatusCode() + "): " + e.getResponseBodyAsString());

        } catch (ResourceAccessException e) {
            // Connection refused / timeout — n8n is down or URL is wrong
            throw new RuntimeException(
                    "Cannot reach n8n at [" + webhookUrl + "]. Is n8n running? Detail: " + e.getMessage());

        } catch (Exception e) {
            throw new RuntimeException(
                    "Unexpected error calling n8n [" + webhookUrl + "]: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEBUG — test n8n connectivity with a single fake message
    // Call GET /api/whatsapp/actions/test-n8n to verify the webhook URL works
    // ─────────────────────────────────────────────────────────────────────────
    public String testN8nConnection() {
        try {
            forwardToN8nWhatsApp("+212600000000", "Test de connexion ELBAHI.NET");
            return "SUCCESS — n8n webhook reachable at: " + n8nPublic + "/webhook/send_message";
        } catch (Exception e) {
            return "FAILED — " + e.getMessage();
        }
    }
}