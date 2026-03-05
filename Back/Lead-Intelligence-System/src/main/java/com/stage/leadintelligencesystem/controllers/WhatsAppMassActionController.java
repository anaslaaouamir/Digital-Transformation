package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedWhatsAppDto;
import com.stage.leadintelligencesystem.services.WhatsAppMassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/whatsapp/actions")
public class WhatsAppMassActionController {

    private final WhatsAppMassActionService massActionService;

    public WhatsAppMassActionController(WhatsAppMassActionService massActionService) {
        this.massActionService = massActionService;
    }

    @PostMapping("/simulate-mass-messages")
    public ResponseEntity<?> simulateMassWhatsApp() {
        try {
            List<SimulatedWhatsAppDto> result = massActionService.simulateMassWhatsApp();
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/send-manual-message")
    public ResponseEntity<?> sendManualWhatsApp(@RequestBody SimulatedWhatsAppDto request) {
        try {
            SimulatedWhatsAppDto result = massActionService.sendManualWhatsApp(request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }

}