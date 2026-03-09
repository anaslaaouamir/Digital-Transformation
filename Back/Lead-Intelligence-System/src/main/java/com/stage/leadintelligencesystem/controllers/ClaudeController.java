package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.dto.SimulatedWhatsAppDto;
import com.stage.leadintelligencesystem.services.ClaudeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/claude")
public class ClaudeController {

    private final ClaudeService claudeService;

    public ClaudeController(ClaudeService claudeService) {
        this.claudeService = claudeService;
    }

    @PostMapping("/generate-and-send")
    public ResponseEntity<?> generateAndSend(@RequestBody Map<String, Object> request) {
        try {
            // Extract the email as a String instead of parsing a Long leadId
            String email = request.get("email").toString();
            String userPrompt = request.get("userPrompt").toString();

            // Pass the email string directly to your updated service method
            SimulatedEmailDto result = claudeService.generateAndSendClaudeEmail(email, userPrompt);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/generate-and-send-whatsapp")
    public ResponseEntity<?> generateAndSendWhatsapp(@RequestBody Map<String, Object> request) {
        try {
            // Extract the phone number and prompt
            String phoneNumber = request.get("phoneNumber").toString();
            String userPrompt = request.get("userPrompt").toString();

            // Pass directly to the new service method
            SimulatedWhatsAppDto result = claudeService.generateAndSendClaudeWhatsapp(phoneNumber, userPrompt);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }
}