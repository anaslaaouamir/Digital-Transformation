package com.stage.leadintelligencesystem.services;

import com.stage.leadintelligencesystem.dto.SimulatedWhatsAppDto;
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
public class WhatsAppMassActionService {

    private final LeadRepository leadRepository;
    private final InteractionRepository interactionRepository;
    private final MessageTemplateRepository templateRepository;

    public WhatsAppMassActionService(LeadRepository leadRepository, InteractionRepository interactionRepository, MessageTemplateRepository templateRepository) {
        this.leadRepository = leadRepository;
        this.interactionRepository = interactionRepository;
        this.templateRepository = templateRepository;
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

            // 4. Log the Interaction
            Interaction interaction = new Interaction();
            interaction.setLead(lead);
            interaction.setChannel("WHATSAPP");
            interaction.setType("MASSE");
            interaction.setStatus("SENT");
            // No subject for WhatsApp
            interaction.setContent(personalizedBody);
            interaction.setSentAt(LocalDateTime.now());

            interactionRepository.save(interaction);

            // 5. Update Lead Status
            lead.setContactStatus("MASS_WHATSAPP_ENVOYE");
            leadRepository.save(lead);

            // 6. Add to DTO list for Postman validation
            generatedMessages.add(new SimulatedWhatsAppDto(
                    lead.getId(), lead.getPhoneNumber(), personalizedBody
            ));
        }

        if (!hotLeads.isEmpty() && generatedMessages.isEmpty()) {
            throw new RuntimeException("Attempted to process " + hotLeads.size() + " hot leads, but no messages were generated.");
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

        // 5. Return the payload to Postman
        return new SimulatedWhatsAppDto(lead.getId(), lead.getPhoneNumber(), personalizedBody);
    }
}