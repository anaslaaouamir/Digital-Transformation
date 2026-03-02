package com.stage.leadintelligencesystem.services;


import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.entities.MessageTemplate;
import com.stage.leadintelligencesystem.repositories.InteractionRepository;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import com.stage.leadintelligencesystem.repositories.MessageTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MassActionService {

    private final LeadRepository leadRepository;
    private final InteractionRepository interactionRepository;
    private final MessageTemplateRepository templateRepository;

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
            String trackingUrl = "https://info-contribution-aims-lightweight.trycloudflare.com/api/tracking/open/" + interaction.getId();
            String pixelHtml = "<img src=\"" + trackingUrl + "\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\"/>";

            String finalBodyWithPixel = personalizedBody + "<br>" + pixelHtml;

            // Optional: Update the DB content to include the exact HTML sent
            interaction.setContent(finalBodyWithPixel);
            interactionRepository.save(interaction);

            // Update Lead Status
            lead.setContactStatus("MASS_EMAIL_ENVOYE");
            leadRepository.save(lead);

            // 6. Add to the results list (Give n8n the body WITH the pixel)
            generatedEmails.add(new SimulatedEmailDto(
                    lead.getId(),
                    lead.getEmail(),
                    personalizedSubject,
                    finalBodyWithPixel
            ));

        }

        return generatedEmails;
    }


    @Transactional
    public void sendManualEmail(SimulatedEmailDto request) {
        // 1. Fetch the lead to ensure it exists and to link the interaction
        Lead lead = leadRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Lead not found with email: " + request.getEmail()));

        // 2. Create the Interaction record (MANUAL type)
        String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isEmpty())
                ? lead.getCompanyName()
                : "votre entreprise";
        String personalizedSubject = request.getSubject().replace("{{company}}", companyName);
        String personalizedBody = request.getBody().replace("{{company}}", companyName);
        Interaction interaction = new Interaction();
        interaction.setLead(lead);
        interaction.setChannel("EMAIL");
        interaction.setType("MANUAL"); // Changed from MASSE to MANUAL
        interaction.setStatus("SENT");
        interaction.setSubject(personalizedSubject);
        interaction.setSentAt(LocalDateTime.now());

        // Save first to get the ID for the tracking pixel
        interaction = interactionRepository.save(interaction);

        // 3. Inject the Spy Pixel
        String trackingUrl = "https://info-contribution-aims-lightweight.trycloudflare.com/api/tracking/open/" + interaction.getId();
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
        forwardToN8n(request.getEmail(), request.getSubject(), finalBodyWithPixel);
    }

    // Helper method to keep code clean
    private void forwardToN8n(String email, String subject, String body) {
        RestTemplate restTemplate = new RestTemplate();
        String n8nWebhookUrl = "http://localhost:5678/webhook/send-email";

        Map<String, String> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("subject", subject);
        payload.put("body", body);

        try {
            restTemplate.postForObject(n8nWebhookUrl, payload, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to forward manual email to n8n: " + e.getMessage());
        }
    }
}