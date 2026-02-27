package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.IncomingReplyDto;
import com.stage.leadintelligencesystem.services.SequenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final SequenceService sequenceService;

    public WebhookController(SequenceService sequenceService) {
        this.sequenceService = sequenceService;
    }

    /**
     * Webhook called by n8n when a NEW email arrives in the inbox.
     * Logic: Finds lead -> Stops Sequence -> Links reply to last sent email -> Updates Status.
     */
    @PostMapping("/email-reply")
    public ResponseEntity<String> handleEmailReply(@RequestBody IncomingReplyDto replyDto) {
        try {
            sequenceService.processIncomingReply(replyDto);
            return ResponseEntity.ok("Success: Reply processed, sequence stopped, and interaction linked.");

        } catch (RuntimeException e) {
            // Log the error (e.g., "Lead not found") but return a clean message
            // You might want to return 200 OK even on failure so n8n doesn't keep retrying forever
            return ResponseEntity.badRequest().body("Error processing reply: " + e.getMessage());
        }
    }
}
