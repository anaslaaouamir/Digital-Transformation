package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.ClaudeGenerateDto;
import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.dto.SimulatedWhatsAppDto;
import com.stage.leadintelligencesystem.services.ClaudeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/claude")
@CrossOrigin(origins = "*")   // safety net in case gateway strips headers
public class ClaudeController {

    private final ClaudeService claudeService;

    public ClaudeController(ClaudeService claudeService) {
        this.claudeService = claudeService;
    }

    /**
     * PREVIEW ONLY — generates content via Claude/n8n but does NOT save
     * an interaction or send anything.  Used by the React "Rédiger avec Claude AI" button.
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody Map<String, Object> request) {
        try {
            String email      = String.valueOf(request.getOrDefault("email",      ""));
            String phone      = String.valueOf(request.getOrDefault("phone",      ""));
            String userPrompt = String.valueOf(request.getOrDefault("userPrompt", ""));
            String channel    = String.valueOf(request.getOrDefault("channel",    "email"));

            ClaudeGenerateDto result = claudeService.generateOnly(email, phone, userPrompt, channel);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * GENERATE + SEND email — saves interaction, appends pixel, fires Gmail via n8n.
     */
    @PostMapping("/generate-and-send")
    public ResponseEntity<?> generateAndSend(@RequestBody Map<String, Object> request) {
        try {
            String email      = request.get("email").toString();
            String userPrompt = request.get("userPrompt").toString();

            SimulatedEmailDto result = claudeService.generateAndSendClaudeEmail(email, userPrompt);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * GENERATE + SEND WhatsApp — saves interaction, fires WhatsApp via n8n.
     */
    @PostMapping("/generate-and-send-whatsapp")
    public ResponseEntity<?> generateAndSendWhatsapp(@RequestBody Map<String, Object> request) {
        try {
            String phoneNumber = request.get("phoneNumber").toString();
            String userPrompt  = request.get("userPrompt").toString();

            SimulatedWhatsAppDto result = claudeService.generateAndSendClaudeWhatsapp(phoneNumber, userPrompt);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}