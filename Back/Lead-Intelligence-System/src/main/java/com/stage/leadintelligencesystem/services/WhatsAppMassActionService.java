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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private String n8n_public;


    public WhatsAppMassActionService(LeadRepository leadRepository, InteractionRepository interactionRepository, MessageTemplateRepository templateRepository, SequenceEnrollmentRepository enrollmentRepository) {
        this.leadRepository = leadRepository;
        this.interactionRepository = interactionRepository;
        this.templateRepository = templateRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional
    public List<SimulatedWhatsAppDto> simulateMassWhatsApp() {
        List<SimulatedWhatsAppDto> generatedMessages = new ArrayList<>();

        // 1. Fetch the "Première approche" template
        MessageTemplate template = templateRepository.findByName("Première approche")
                .orElseThrow(() -> new RuntimeException("Template 'Première approche' not found"));

        // 2. Fetch leads (HOT, NON_CONTACTE, and MUST have a phone number)
        List<Lead> hotLeads = leadRepository.findByTemperatureAndContactStatusAndPhoneNumberIsNotNull("HOT", "NON_CONTACTE");

        // 3. Loop through leads and perform the string replacement
        for (Lead lead : hotLeads) {

            // Safety check: if company name is null, use a generic fallback
            String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isEmpty())
                    ? lead.getCompanyName()
                    : "votre entreprise";

            // WhatsApp formatting: NO HTML conversion, keep standard \n from the database
            String personalizedBody = template.getBody().replace("{{company}}", companyName);

            // 4. Log the Interaction initially
            Interaction interaction = new Interaction();
            interaction.setLead(lead);
            interaction.setChannel("WHATSAPP");
            interaction.setType("MASSE");
            interaction.setStatus("SENT");
            interaction.setContent(personalizedBody);
            interaction.setSentAt(LocalDateTime.now());

            // Save to get it in the database temporarily
            interaction = interactionRepository.save(interaction);

            // 5. ATTEMPT TO SEND VIA N8N WITH ERROR HANDLING
            try {
                // Call your existing helper method using the webhook
                forwardToN8nWhatsApp(lead.getPhoneNumber(), personalizedBody);

                // If successful (no exception thrown), finalize the Lead status
                lead.setContactStatus("MASS_WHATSAPP_ENVOYE");
                leadRepository.save(lead);

                // Add to DTO list for Postman validation
                generatedMessages.add(new SimulatedWhatsAppDto(
                        lead.getId(), lead.getPhoneNumber(), personalizedBody
                ));

            } catch (Exception e) {
                // Any error (n8n down or bad number) -> Mark as bounced
                interaction.setStatus("BOUNCED");
                interactionRepository.save(interaction);

                lead.setContactStatus("BOUNCED_PHONENUMBER");
                leadRepository.save(lead);

                // Log the failure, but let the loop continue to the next lead!
                System.err.println("WhatsApp failed for phone " + lead.getPhoneNumber() + ". Marked as BOUNCED. Reason: " + e.getMessage());
            }
        }

        // Only throw an error if we had leads to process but literally ALL of them failed
        if (!hotLeads.isEmpty() && generatedMessages.isEmpty()) {
            throw new RuntimeException("WhatsApp mass send failed entirely. Attempted " + hotLeads.size() + " leads, but all failed.");
        }

        return generatedMessages;
    }

    @Transactional
    public SimulatedWhatsAppDto sendManualWhatsApp(SimulatedWhatsAppDto request) {
        // 1. Fetch the lead using phone number
        Lead lead = leadRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new RuntimeException("Lead not found with phone number: " + request.getPhoneNumber()));

        // 2. Personalize the body (No HTML conversions)
        String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isEmpty())
                ? lead.getCompanyName()
                : "votre entreprise";
        String personalizedBody = request.getBody().replace("{{company}}", companyName);

        // 3. Create the Interaction record (MANUAL type)
        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("WHATSAPP");
        interaction.setType("MANUAL");
        interaction.setStatus("SENT");
        interaction.setContent(personalizedBody);
        interaction.setSentAt(LocalDateTime.now());

        interactionRepository.save(interaction);

        // 4. Update Lead Status (Only if not already in a sequence)
        if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
            lead.setContactStatus("MANUAL_WHATSAPP_ENVOYE");
            leadRepository.save(lead);
        }

        forwardToN8nWhatsApp(lead.getPhoneNumber(), personalizedBody);

        // 5. Return the payload to Postman
        return new SimulatedWhatsAppDto(lead.getId(), lead.getPhoneNumber(), personalizedBody);
    }


    // Helper method to forward the data to n8n
    private void forwardToN8nWhatsApp(String phoneNumber, String message) {
        RestTemplate restTemplate = new RestTemplate();
        // Replace with your actual n8n Webhook URL for WhatsApp
        String n8nWebhookUrl = n8n_public+"/webhook/send_message";

        Map<String, String> payload = new HashMap<>();
        payload.put("phoneNumber", phoneNumber);
        payload.put("message", message);

        try {
            restTemplate.postForObject(n8nWebhookUrl, payload, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to forward manual WhatsApp to n8n: " + e.getMessage());
        }
    }


    @Transactional
    public void processIncomingWhatsApp(Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        String message = payload.get("message");
        String timestampStr = payload.get("timestamp"); // Grab the Unix timestamp

        if (phoneNumber == null || message == null) {
            throw new RuntimeException("Missing phoneNumber or message in the webhook payload");
        }

        // --- CONVERT UNIX TIMESTAMP TO LOCALDATETIME ---
        LocalDateTime repliedAtTime = LocalDateTime.now(); // Default fallback
        if (timestampStr != null && !timestampStr.isEmpty()) {
            try {
                long unixSeconds = Long.parseLong(timestampStr);
                repliedAtTime = LocalDateTime.ofInstant(Instant.ofEpochSecond(unixSeconds), ZoneId.systemDefault());
            } catch (NumberFormatException e) {
                System.err.println("Could not parse WhatsApp timestamp: " + timestampStr);
            }
        }

        // 1. Find the Lead by phone number
        Lead lead = leadRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("Lead not found with phone number: " + phoneNumber));

        // 2. GLOBAL STATUS UPDATE
        if (!"A_REPONDU".equals(lead.getContactStatus())) {
            lead.setContactStatus("A_REPONDU");
            leadRepository.save(lead);
        }

        // 3. STOP SEQUENCE
        Optional<SequenceEnrollment> activeEnrollment = enrollmentRepository.findByLeadAndStatus(lead, "ACTIVE");
        if (activeEnrollment.isPresent()) {
            SequenceEnrollment enrollment = activeEnrollment.get();
            enrollment.setStatus("CANCELLED");
            enrollment.setNextExecutionDate(null);
            enrollmentRepository.save(enrollment);
        }

        // 4. FIND AND UPDATE PREVIOUS MESSAGES
        List<Interaction> previousMessages = interactionRepository.findByLeadAndChannelAndStatusInOrderBySentAtDesc(
                lead, "WHATSAPP", List.of("SENT")
        );

        if (!previousMessages.isEmpty()) {
            // A. The most recent message gets the "REPLIED" status and the exact reply time
            Interaction mostRecent = previousMessages.get(0);
            mostRecent.setStatus("REPLIED");
            mostRecent.setRepliedAt(repliedAtTime); // <-- Using exact WhatsApp time
            mostRecent.setOpenedAt(repliedAtTime);
            interactionRepository.save(mostRecent);

            // B. All older messages get marked as "OPENED" (Read)
            for (int i = 1; i < previousMessages.size(); i++) {
                Interaction olderMessage = previousMessages.get(i);

                if (!"OPENED".equals(olderMessage.getStatus())) {
                    olderMessage.setStatus("OPENED");
                    if (olderMessage.getOpenedAt() == null) {
                        olderMessage.setOpenedAt(repliedAtTime); // <-- Assuming they read it right before replying
                    }
                    interactionRepository.save(olderMessage);
                }
            }
        }

        // 5. LOG THE NEW RESPONSE
        Interaction responseInteraction = new Interaction();
        responseInteraction.setLead(lead);
        responseInteraction.setChannel("WHATSAPP");
        responseInteraction.setType("RESPONSE");
        responseInteraction.setStatus("RECEIVED");
        responseInteraction.setContent(message);
        responseInteraction.setSentAt(repliedAtTime); // <-- Log the exact time they sent the text

        interactionRepository.save(responseInteraction);
    }


}