package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.IncomingReplyDto;
import com.stage.leadintelligencesystem.services.SequenceService;
import com.stage.leadintelligencesystem.services.WhatsAppMassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
@CrossOrigin(origins = "*")
public class WebhookController {

    private final SequenceService sequenceService;
    private final WhatsAppMassActionService whatsAppMassActionService;

    public WebhookController(SequenceService sequenceService, WhatsAppMassActionService whatsAppMassActionService) {
        this.sequenceService = sequenceService;
        this.whatsAppMassActionService = whatsAppMassActionService;
    }

    /**
     * Webhook called by n8n when a NEW email arrives in the inbox.
     * Logic: Finds lead -> Stops Sequence -> Links reply to last sent email -> Updates Status.
     */
    @PostMapping("/email-reply")
    public ResponseEntity<String> handleEmailReply(@RequestBody IncomingReplyDto replyDto) {
        try {
            sequenceService.processIncomingReply(replyDto);
            return ResponseEntity.ok("{\"status\": \"success\", \"message\": \"Reply processed\"}");
        } catch (RuntimeException e) {

            // You might want to return 200 OK even on failure so n8n doesn't keep retrying forever
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");        }
    }

    @PostMapping("/email-bounce")
    public ResponseEntity<String> handleEmailBounce(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            sequenceService.handleBouncedEmail(email);
            return ResponseEntity.ok("{\"status\": \"success\", \"message\": \"Bounce processed\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/whatsapp-reply")
    public ResponseEntity<String> handleWhatsAppReply(@RequestBody Map<String, String> payload) {
        try {
            whatsAppMassActionService.processIncomingWhatsApp(payload);
            return ResponseEntity.ok("{\"status\": \"success\", \"message\": \"WhatsApp reply processed\"}");
        } catch (RuntimeException e) {
            // Returns 400 Bad Request with the error message if the phone number doesn't match a lead
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }
}