package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.services.MassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/actions")
@CrossOrigin(origins = "*")
public class MassActionController {

    private final MassActionService massActionService;

    public MassActionController(MassActionService massActionService) {
        this.massActionService = massActionService;
    }

    @PostMapping("/simulate-mass-emails")
    public ResponseEntity<?> simulateMassEmails() { // Changed to <?>
        try {
            List<SimulatedEmailDto> result = massActionService.simulateMassEmails();
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            // If n8n is down, this returns the exact error message we wrote in the service
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/send-manual-email")
    public ResponseEntity<String> sendManualEmail(@RequestBody SimulatedEmailDto request) {
        try {
            massActionService.sendManualEmail(request);
            return ResponseEntity.ok("Manual email sent and tracked successfully.");
        } catch (RuntimeException e) {
            // Returns a clean 400 error if n8n is down, so your frontend knows exactly what happened
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/mark-contact-status")
    public ResponseEntity<String> markContactStatus(@RequestBody Map<String, Object> payload) {
        try {
            Object idObj = payload.get("leadId");
            if (idObj == null) return ResponseEntity.badRequest().body("leadId is required");
            Long leadId = (idObj instanceof Number) ? ((Number) idObj).longValue() : Long.parseLong(String.valueOf(idObj));
            String status = String.valueOf(payload.getOrDefault("status", "MANUAL_EMAIL_ENVOYE"));
            massActionService.updateLeadContactStatus(leadId, status);
            return ResponseEntity.ok("Contact status updated to " + status);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid request: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

}
