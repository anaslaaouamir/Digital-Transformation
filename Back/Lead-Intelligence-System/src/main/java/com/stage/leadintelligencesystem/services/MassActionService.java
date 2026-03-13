package com.stage.leadintelligencesystem.services;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.entities.MessageTemplate;
import com.stage.leadintelligencesystem.repositories.InteractionRepository;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import com.stage.leadintelligencesystem.repositories.MessageTemplateRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class MassActionService {

    private final LeadRepository leadRepository;
    private final InteractionRepository interactionRepository;
    private final MessageTemplateRepository templateRepository;
    @Value("${app.tracking.url}")
    private String trackingBaseUrl;

    public MassActionService(LeadRepository leadRepository, InteractionRepository interactionRepository, MessageTemplateRepository templateRepository) {
        this.leadRepository = leadRepository;
        this.interactionRepository = interactionRepository;
        this.templateRepository = templateRepository;
    }

    @Transactional
    public List<SimulatedEmailDto> simulateMassEmails() {
        List<SimulatedEmailDto> generatedEmails = new ArrayList<>();

        // 1. Fetch the "Première approche" template [cite: 11, 12]
        MessageTemplate template = templateRepository.findByName("Première approche")
                .orElseThrow(() -> new RuntimeException("Template 'Première approche' not found"));

        // 2. Fetch leads (Adjust the repository method to match your exact fields)
        // Assuming you have a method like: findByTemperatureAndContactStatusAndEmailIsNotNull
        List<Lead> hotLeads = leadRepository.findByTemperatureAndContactStatusAndEmailIsNotNull("HOT", "NON_CONTACTE");
        System.out.println("********************************************");
        System.out.println(hotLeads);

        // 3. Loop through leads and perform the string replacement
        for (Lead lead : hotLeads) {

            // Safety check: if company name is null, use a generic fallback
            String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isEmpty())
                    ? lead.getCompanyName()
                    : "votre entreprise";

            // The exact String Replacement logic!
            String personalizedSubject = template.getSubject().replace("{{company}}", companyName);
            String personalizedBody = template.getBody().replace("{{company}}", companyName).replace("\n", "<br>");

            // 4. Update the database (Simulating that n8n returned a success)

            // Log the Interaction
            Interaction interaction = new Interaction();
            interaction.setLead(lead);
            interaction.setChannel("EMAIL"); // [cite: 2]
            interaction.setType("MASSE"); // Adding MASSE as we discussed
            interaction.setStatus("SENT"); // [cite: 4]
            interaction.setSubject(personalizedSubject);
            interaction.setContent(personalizedBody);
            interaction.setSentAt(LocalDateTime.now());
            interaction = interactionRepository.save(interaction);

            // 5. INJECT THE SPY PIXEL
            //String trackingUrl = "https://info-contribution-aims-lightweight.trycloudflare.com/api/tracking/open/" + interaction.getId();
            String trackingUrl = trackingBaseUrl+ "/api/tracking/open/" + interaction.getId();
            String pixelHtml = "<img src=\"" + trackingUrl + "\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\"/>";

            String finalBodyWithPixel = personalizedBody + "<br>" + pixelHtml;

            // ---> MINIMAL FIX START <---
            try {
                // Try to send to n8n FIRST using your existing helper
                forwardToN8n(lead.getEmail(), personalizedSubject, finalBodyWithPixel, null);

                // If it succeeds, finalize the DB updates
                interaction.setContent(finalBodyWithPixel);
                interactionRepository.save(interaction);

                lead.setContactStatus("MASS_EMAIL_ENVOYE");
                leadRepository.save(lead);

                generatedEmails.add(new SimulatedEmailDto(
                        lead.getId(), lead.getEmail(), personalizedSubject, finalBodyWithPixel
                ));

            } catch (Exception e) {
                // If n8n fails, just delete the interaction we saved in step 4
                interactionRepository.delete(interaction);
                System.err.println("n8n failed for " + lead.getEmail() + ". Email not saved.");
            }
            // ---> MINIMAL FIX END <---
        }

        if (!hotLeads.isEmpty() && generatedEmails.isEmpty()) {
            throw new RuntimeException("n8n webhook failed. Attempted to send to " + hotLeads.size() + " hot leads, but none were sent.");
        }

        return generatedEmails;
    }


    @Transactional
    public void sendManualEmail(String email, String subject, String body, List<MultipartFile> files) {
        // 1. Fetch the lead to ensure it exists and to link the interaction
        Lead lead = leadRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Lead not found with email: " + email));

        // 2. Create the Interaction record (MANUAL type)
        String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isEmpty())
                ? lead.getCompanyName()
                : "votre entreprise";

        String personalizedSubject = subject.replace("{{company}}", companyName);
        String personalizedBody    = body.replace("{{company}}", companyName);

        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("EMAIL");
        interaction.setType("MANUAL"); // Changed from MASSE to MANUAL
        interaction.setStatus("SENT");
        interaction.setSubject(personalizedSubject);
        interaction.setSentAt(LocalDateTime.now());

        // Save first to get the ID for the tracking pixel
        interaction = interactionRepository.save(interaction);

        // Save attachments if provided
        String attachmentUrlsJson = null;
        if (files != null && !files.isEmpty()) {
            try {
                String uploadDir = System.getProperty("user.dir") + "/uploads/interactions/";                Files.createDirectories(Paths.get(uploadDir));
                List<String> urls = new ArrayList<>();
                for (MultipartFile file : files) {
                    if (!file.isEmpty()) {
                        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                        Path filePath = Paths.get(uploadDir + fileName);
                        Files.write(filePath, file.getBytes());
                        urls.add("/uploads/interactions/" + fileName);
                    }
                }
                if (!urls.isEmpty()) {
                    attachmentUrlsJson = new ObjectMapper().writeValueAsString(urls);
                    interaction.setAttachmentUrls(attachmentUrlsJson);
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to save attachments: " + e.getMessage());
            }
        }

        // 3. Inject the Spy Pixel
        //String trackingUrl = "https://info-contribution-aims-lightweight.trycloudflare.com/api/tracking/open/" + interaction.getId();
        String trackingUrl = trackingBaseUrl+ "/api/tracking/open/" + interaction.getId();
        String pixelHtml = "<img src=\"" + trackingUrl + "\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\"/>";
        String finalBodyWithPixel = personalizedBody.replace("\n", "<br>") + "<br>" + pixelHtml;

        // Update interaction with final HTML content
        interaction.setContent(finalBodyWithPixel);
        interactionRepository.save(interaction);

        if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
            lead.setContactStatus("MANUAL_EMAIL_ENVOYE");
            leadRepository.save(lead);
        }

        // 4. Forward to the same n8n Webhook
        forwardToN8n(email, subject, finalBodyWithPixel, attachmentUrlsJson);    }

    // Helper method to keep code clean
    private void forwardToN8n(String email, String subject, String body, String attachmentUrlsJson) {
        RestTemplate restTemplate  = new RestTemplate();
        String       n8nWebhookUrl = "http://localhost:5678/webhook/send-email";

        Map<String, Object> payload = new HashMap<>();
        payload.put("email",   email);
        payload.put("subject", subject);
        payload.put("body",    body);
        if (attachmentUrlsJson != null) {
            payload.put("attachmentUrls", attachmentUrlsJson);
        }

        try {
            restTemplate.postForObject(n8nWebhookUrl, payload, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to forward manual email to n8n: " + e.getMessage());
        }
    }
}