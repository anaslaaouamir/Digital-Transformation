package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.services.MassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

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


}