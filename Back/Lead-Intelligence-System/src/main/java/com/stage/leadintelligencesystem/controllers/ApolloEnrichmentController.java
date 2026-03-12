package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.services.ApolloEnrichmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enrichment")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ApolloEnrichmentController {

    private final ApolloEnrichmentService apolloEnrichmentService;

    // Enrich a single lead
    // POST /api/enrichment/leads/{id}
    @PostMapping("/leads/{id}")
    public ResponseEntity<Lead> enrichLead(@PathVariable Long id) {
        Lead enriched = apolloEnrichmentService.enrichLead(id);
        return ResponseEntity.ok(enriched);
    }

    // Enrich all leads where isEnriched = false
    // POST /api/enrichment/leads/batch
    @PostMapping("/leads/batch")
    public ResponseEntity<String> enrichAllPending() {
        apolloEnrichmentService.enrichAllPending();
        return ResponseEntity.ok("Batch enrichment completed.");
    }
}