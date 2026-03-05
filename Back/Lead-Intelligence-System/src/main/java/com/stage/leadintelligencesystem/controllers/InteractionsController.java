package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.repositories.InteractionRepository;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/interactions")
@CrossOrigin(origins = "*")
public class InteractionsController {

    private final InteractionRepository interactionRepository;
    private final LeadRepository leadRepository;

    public InteractionsController(InteractionRepository interactionRepository, LeadRepository leadRepository) {
        this.interactionRepository = interactionRepository;
        this.leadRepository = leadRepository;
    }

    static class InteractionDTO {
        public Long id;
        public Long leadId;
        public String company;
        public String city;
        public String email;
        public String phone;
        public String sector;
        public String contactStatus;
        public String channel;
        public String type;
        public String status;
        public String subject;
        public String content;
        public String sentAt;
        public String openedAt;
        public String repliedAt;

        InteractionDTO(Interaction i) {
            this.id = i.getId();
            Lead l = i.getLead();
            this.leadId = l != null ? l.getId() : null;
            this.company = l != null ? l.getCompanyName() : null;
            this.city = l != null ? l.getCity() : null;
            this.email = l != null ? l.getEmail() : null;
            this.phone = l != null ? l.getPhoneNumber() : null;
            this.sector = l != null && l.getSecteur() != null ? l.getSecteur().getName() : null;
            this.contactStatus = l != null ? l.getContactStatus() : null;
            this.channel = i.getChannel();
            this.type = i.getType();
            this.status = i.getStatus();
            this.subject = i.getSubject();
            this.content = i.getContent();
            this.sentAt = i.getSentAt() != null ? i.getSentAt().toString() : null;
            this.openedAt = i.getOpenedAt() != null ? i.getOpenedAt().toString() : null;
            this.repliedAt = i.getRepliedAt() != null ? i.getRepliedAt().toString() : null;
        }
    }

    @GetMapping
    public List<InteractionDTO> listAll() {
        return interactionRepository.findAll()
                .stream()
                .map(InteractionDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/lead/{leadId}")
    public List<InteractionDTO> byLead(@PathVariable Long leadId) {
        Lead lead = leadRepository.findById(ladIdOrThrow(leadId)).orElseThrow();
        return interactionRepository.findByLead(lead)
                .stream()
                .map(InteractionDTO::new)
                .collect(Collectors.toList());
    }

    private Long ladIdOrThrow(Long id) {
        if (id == null) throw new IllegalArgumentException("leadId is required");
        return id;
    }

    static class CreateInteractionRequest {
        public Long leadId;
        public String subject;
        public String content;
        public String channel;
        public String type;
        public String status;
    }

    @PostMapping
    public InteractionDTO create(@RequestBody CreateInteractionRequest req) {
        if (req.leadId == null) throw new IllegalArgumentException("leadId is required");
        Lead lead = leadRepository.findById(req.leadId).orElseThrow();
        Interaction i = new Interaction();
        i.setLead(lead);
        i.setChannel(req.channel != null ? req.channel : "EMAIL");
        i.setType(req.type != null ? req.type : "MANUAL");
        i.setStatus(req.status != null ? req.status : "SENT");
        i.setSubject(req.subject);
        i.setContent(req.content);
        i.setSentAt(java.time.LocalDateTime.now());
        i = interactionRepository.save(i);
        return new InteractionDTO(i);
    }
}
