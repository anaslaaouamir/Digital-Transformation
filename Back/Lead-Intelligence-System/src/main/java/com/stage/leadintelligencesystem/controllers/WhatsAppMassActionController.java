package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedWhatsAppDto;
import com.stage.leadintelligencesystem.services.WhatsAppMassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp/actions")
@CrossOrigin(origins = "*")
public class WhatsAppMassActionController {

    private final WhatsAppMassActionService massActionService;

    public WhatsAppMassActionController(WhatsAppMassActionService massActionService) {
        this.massActionService = massActionService;
    }

    // ── MASS SEND ─────────────────────────────────────────────────────────────
    @PostMapping("/simulate-mass-messages")
    public ResponseEntity<?> simulateMassWhatsApp(
            @RequestBody(required = false) Map<String, Object> request) {
        try {
            List<Long> leadIds = null;

            if (request != null && request.containsKey("leadIds")) {
                Object raw = request.get("leadIds");
                if (raw instanceof List<?> rawList) {
                    leadIds = rawList.stream()
                            .filter(item -> item instanceof Number)
                            .map(item -> ((Number) item).longValue())
                            .toList();
                }
            }

            System.out.println("[WhatsApp] /simulate-mass-messages called with leadIds=" + leadIds);

            List<SimulatedWhatsAppDto> result = massActionService.simulateMassWhatsApp();
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "status", "error",
                            "message", e.getMessage() != null ? e.getMessage() : "Unknown error"
                    ));
        }
    }

    // ── MANUAL SEND ───────────────────────────────────────────────────────────
    @PostMapping("/send-manual-message")
    public ResponseEntity<?> sendManualWhatsApp(@RequestBody SimulatedWhatsAppDto request) {
        try {
            SimulatedWhatsAppDto result = massActionService.sendManualWhatsApp(request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "status", "error",
                            "message", e.getMessage() != null ? e.getMessage() : "Unknown error"
                    ));
        }
    }

    // ── DEBUG: TEST N8N CONNECTIVITY ──────────────────────────────────────────
    // Hit GET /api/whatsapp/actions/test-n8n in browser or Postman
    // to verify your n8n webhook URL is reachable before running mass send
    @GetMapping("/test-n8n")
    public ResponseEntity<String> testN8n() {
        String result = massActionService.testN8nConnection();
        boolean ok = result.startsWith("SUCCESS");
        return ok
                ? ResponseEntity.ok(result)
                : ResponseEntity.status(503).body(result);
    }
}