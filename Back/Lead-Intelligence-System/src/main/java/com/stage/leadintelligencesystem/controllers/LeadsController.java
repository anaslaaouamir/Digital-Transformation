package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leads")
@CrossOrigin(origins = "*")
public class LeadsController {

    private final LeadRepository leadRepository;

    public LeadsController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    static class LeadDTO {
        public Long id;
        public String companyName;
        public String city;
        public String phoneNumber;
        public String email;
        public String website;
        public String linkedinUrl;
        public Double googleRating;
        public Integer googleReviews;
        public Integer aiScore;
        public String temperature;
        public String secteurName;
        public String contactStatus;

        LeadDTO(Lead l) {
            this.id = l.getId();
            this.companyName = l.getCompanyName();
            this.city = l.getCity();
            this.phoneNumber = l.getPhoneNumber();
            this.email = l.getEmail();
            this.website = l.getWebsite();
            this.linkedinUrl = l.getLinkedinUrl();
            this.googleRating = l.getGoogleRating();
            this.googleReviews = l.getGoogleReviews();
            this.aiScore = l.getAiScore();
            this.temperature = l.getTemperature();
            this.secteurName = l.getSecteur() != null ? l.getSecteur().getName() : null;
            this.contactStatus = l.getContactStatus();
        }
    }

    @GetMapping
    public List<LeadDTO> list() {
        return leadRepository.findAll()
                .stream()
                .map(LeadDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public LeadDTO get(@PathVariable Long id) {
        Lead l = leadRepository.findById(id).orElse(null);
        return l != null ? new LeadDTO(l) : null;
    }
}
