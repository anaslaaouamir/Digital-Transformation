package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.services.MassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/actions")
public class MassActionController {

    private final MassActionService massActionService;

    public MassActionController(MassActionService massActionService) {
        this.massActionService = massActionService;
    }

    @PostMapping("/simulate-mass-emails")
    public ResponseEntity<List<SimulatedEmailDto>> simulateMassEmails() {
        // 1. Generate the list of personalized emails
        List<SimulatedEmailDto> result = massActionService.simulateMassEmails();

        RestTemplate restTemplate = new RestTemplate();
        String n8nWebhookUrl = "http://localhost:5678/webhook/send-email";

        // 2. Loop through the results and send them to n8n individually
        for (SimulatedEmailDto emailDto : result) {
            Map<String, String> body = new HashMap<>();

            // Map the fields from your DTO to the expected n8n payload
            body.put("email", emailDto.getEmail());
            body.put("subject", emailDto.getSubject());
            body.put("body", emailDto.getBody());

            try {
                // Fire the request to n8n
                restTemplate.postForObject(n8nWebhookUrl, body, String.class);
                System.out.println("***************************************************");
                System.out.println("Successfully forwarded to n8n for: " + emailDto.getEmail());
            } catch (Exception e) {
                System.out.println("***************************************************");
                // Catch any connection errors so one failure doesn't stop the whole loop
                System.err.println("Failed to forward to n8n for " + emailDto.getEmail() + " - Error: " + e.getMessage());
            }
        }

        // Return the full list back as the API response
        return ResponseEntity.ok(result);
    }


    @PostMapping("/send-manual-email")
    public ResponseEntity<String> sendManualEmail(@RequestBody SimulatedEmailDto request) {
        // 1. Delegate to service for DB logging, tracking pixel injection, and n8n forwarding
        massActionService.sendManualEmail(request);

        return ResponseEntity.ok("Manual email sent and tracked successfully.");
    }


}