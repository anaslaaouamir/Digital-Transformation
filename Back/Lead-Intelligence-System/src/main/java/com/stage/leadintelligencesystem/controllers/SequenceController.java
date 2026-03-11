package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.entities.SequenceEnrollment;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import com.stage.leadintelligencesystem.repositories.SequenceEnrollmentRepository;
import com.stage.leadintelligencesystem.services.SequenceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/sequences")
@CrossOrigin(origins = "*")
public class SequenceController {

    private final SequenceService sequenceService;
    private final LeadRepository leadRepository;
    private final SequenceEnrollmentRepository sequenceEnrollmentRepository;

    public SequenceController(SequenceService sequenceService, LeadRepository leadRepository, SequenceEnrollmentRepository sequenceEnrollmentRepository) {
        this.sequenceService = sequenceService;
        this.leadRepository = leadRepository;
        this.sequenceEnrollmentRepository = sequenceEnrollmentRepository;
    }

    @PostMapping("/start/{leadId}")
    public ResponseEntity<?> startSequence(@PathVariable Long leadId) {
        try {
            SequenceEnrollment enrollment = sequenceService.startSequenceForLead(leadId);

            String message = (enrollment.getCurrentStepOrder() == 2)
                    ? "Smart Skip Activated: Started sequence at Step 2 (Relance)."
                    : "Started sequence at Step 1 (Première approche).";

            return ResponseEntity.ok(message);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/process-daily-emails")
    public ResponseEntity<List<SimulatedEmailDto>> processDailyBatch() {
        List<SimulatedEmailDto> sentEmails = sequenceService.processDailyEmails();
        return ResponseEntity.ok(sentEmails);
    }





    @PostMapping("/cancel/{leadId}")
    public ResponseEntity<?> cancelSequence(@PathVariable Long leadId) {
        try {
            sequenceService.cancelSequenceForLead(leadId);
            return ResponseEntity.ok("Sequence cancelled for lead " + leadId);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}