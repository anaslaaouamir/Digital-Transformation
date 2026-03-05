package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.entities.SequenceEnrollment;
import com.stage.leadintelligencesystem.services.SequenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sequences")
@CrossOrigin(origins = "*")
public class SequenceController {

    private final SequenceService sequenceService;

    public SequenceController(SequenceService sequenceService) {
        this.sequenceService = sequenceService;
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
}
