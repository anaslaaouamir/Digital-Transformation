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
    public List<SimulatedEmailDto> simulateMassEmails(List<Long> leadIds) {
        List<SimulatedEmailDto> generatedEmails = new ArrayList<>();

        // 1. Try to fetch the "Première approche" template; fall back to defaults if missing
        MessageTemplate template = templateRepository.findByName("Première approche").orElse(null);
        String defaultSubject = "Collaboration digitale — {{company}}";
        String defaultBody = "Bonjour,\n\nJ'ai découvert {{company}}. Disponible pour 15 minutes cette semaine ?\n\nCordialement,\nAbderrahim\nELBAHI.NET";

        // 2. Fetch leads: prefer explicit IDs from payload, otherwise default HOT/NON_CONTACTE
        List<Lead> hotLeads;
        if (leadIds != null && !leadIds.isEmpty()) {
            hotLeads = leadRepository.findAllById(leadIds);
        } else {
            hotLeads = leadRepository.findByTemperatureAndContactStatusAndEmailIsNotNull("HOT", "NON_CONTACTE");
        }

        // 3. Loop through leads and perform the string replacement
        for (Lead lead : hotLeads) {
            if (lead.getEmail() == null || lead.getEmail().isBlank()) {
                continue;
            }

            // Safety check: if company name is null, use a generic fallback
            String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isEmpty())
                    ? lead.getCompanyName()
                    : "votre entreprise";

            // The exact String Replacement logic!
            String subjectBase = (template != null ? template.getSubject() : defaultSubject);
            String bodyBase    = (template != null ? template.getBody()    : defaultBody);
            String personalizedSubject = subjectBase.replace("{{company}}", companyName);
            String personalizedBody    = bodyBase.replace("{{company}}", companyName).replace("\n", "<br>");

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
            String trackingUrl = "https://philips-considered-academy-musicians.trycloudflare.com/api/tracking/open/" + interaction.getId();
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
        if ((request.getLeadId() == null || request.getLeadId() <= 0) && (request.getEmail() == null || request.getEmail().isBlank())) {
            throw new IllegalArgumentException("leadId or email is required");
        }
        // Prefer leadId lookup to avoid failures when email is missing/mismatched
        Lead lead;
        if (request.getLeadId() != null && request.getLeadId() > 0) {
            lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new IllegalArgumentException("Lead not found: id=" + request.getLeadId()));
        } else {
            lead = leadRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("Lead not found with email: " + request.getEmail()));
        }

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
        String trackingUrl = "https://philips-considered-academy-musicians.trycloudflare.com/api/tracking/open/" + interaction.getId();
        String pixelHtml = "<img src=\"" + trackingUrl + "\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\"/>";
        String finalBodyWithPixel = personalizedBody.replace("\n", "<br>") + "<br>" + pixelHtml;

        // Update interaction with final HTML content
        interaction.setContent(finalBodyWithPixel);
        interactionRepository.save(interaction);

        if (!"EN_SEQUENCE".equals(lead.getContactStatus())) {
            lead.setContactStatus("MANUAL_EMAIL_ENVOYE");
            leadRepository.save(lead);
        }

        // 4. Forward to the same n8n Webhook (best-effort, don't fail the request)
        try {
            forwardToN8n(lead.getEmail(), request.getSubject(), finalBodyWithPixel);
        } catch (Exception e) {
            // Log only; do not throw to keep 200 OK when DB is updated
            System.err.println("n8n forward failed: " + e.getMessage());
        }
    }

    @Transactional
    public void updateLeadContactStatus(Long leadId, String status) {
        if (leadId == null || leadId <= 0) throw new IllegalArgumentException("leadId is required");
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: id=" + leadId));
        lead.setContactStatus(status != null && !status.isBlank() ? status : "MANUAL_EMAIL_ENVOYE");
        leadRepository.save(lead);
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
