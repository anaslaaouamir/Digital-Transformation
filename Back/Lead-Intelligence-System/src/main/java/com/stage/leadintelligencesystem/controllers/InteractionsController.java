package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.SequenceEnrollment;
import com.stage.leadintelligencesystem.services.InteractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interactions")
@CrossOrigin(origins = "*")
public class InteractionsController {

    private final InteractionService interactionService;

    public InteractionsController(InteractionService interactionService) {
        this.interactionService = interactionService;
    }

    // 1. Get all interactions
    @GetMapping
    public List<Interaction> getAllInteractions() {
        return interactionService.getAllInteractions();
    }

    // 2. Get interaction by ID
    @GetMapping("/{id}")
    public ResponseEntity<Interaction> getInteractionById(@PathVariable Long id) {
        return interactionService.getInteractionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Get interactions for a specific lead
    @GetMapping("/lead/{leadId}")
    public List<Interaction> getInteractionsByLead(@PathVariable Long leadId) {
        return interactionService.getInteractionsByLeadId(leadId);
    }

    // 4. Get all sequence enrollments
    @GetMapping("/sequences")
    public List<SequenceEnrollment> getAllSequences() {
        return interactionService.getAllSequences();
    }

    // 5. Get only ACTIVE sequences
    @GetMapping("/sequences/active")
    public List<SequenceEnrollment> getActiveSequences() {
        return interactionService.getActiveSequences();
    }

    // 6. Get sequence by ID
    @GetMapping("/sequences/{id}")
    public ResponseEntity<SequenceEnrollment> getSequenceById(@PathVariable Long id) {
        return interactionService.getSequenceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 7. Get sequences by Lead ID
    @GetMapping("/sequences/lead/{leadId}")
    public List<SequenceEnrollment> getSequencesByLead(@PathVariable Long leadId) {
        return interactionService.getSequencesByLeadId(leadId);
    }

    @GetMapping("/{id}/response")
    public ResponseEntity<Interaction> getResponse(@PathVariable Long id) {
        return interactionService.getResponseForInteraction(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
