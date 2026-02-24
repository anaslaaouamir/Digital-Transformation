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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

        // 3. Loop through leads and perform the string replacement
        for (Lead lead : hotLeads) {

            // Safety check: if company name is null, use a generic fallback
            String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isEmpty())
                    ? lead.getCompanyName()
                    : "votre entreprise";

            // The exact String Replacement logic!
            String personalizedSubject = template.getSubject().replace("{{company}}", companyName);
            String personalizedBody = template.getBody().replace("{{company}}", companyName);

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
            interactionRepository.save(interaction);

            // Update Lead Status
            lead.setContactStatus("EMAIL_ENVOYE");
            leadRepository.save(lead);

            // 5. Add to the results list
            generatedEmails.add(new SimulatedEmailDto(
                    lead.getId(),
                    lead.getEmail(),
                    personalizedSubject,
                    personalizedBody
            ));
        }

        return generatedEmails;
    }
}
