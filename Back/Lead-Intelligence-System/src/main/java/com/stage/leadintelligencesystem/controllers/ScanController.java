package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.ScanRequest;
import com.stage.leadintelligencesystem.services.ScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lead_agent")
@CrossOrigin(origins = "*") // Allows your React frontend to communicate with this API
public class ScanController {

    private final ScanService scanService;

    // Constructor injection is the recommended approach in Spring
    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> startScan(@RequestBody ScanRequest request) {
        try {
            String jobId = scanService.initiateScan(request);
            if (jobId == null || jobId.isEmpty()) {
                return ResponseEntity.status(502).body(Map.of("error", "Le service d'extraction n'a pas renvoyé de job_id"));
            }

            return ResponseEntity.accepted().body(Map.of("job_id", jobId));
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            String msg = ex.getResponseBodyAsString();
            if (msg == null || msg.isBlank()) msg = ex.getStatusCode().toString();
            return ResponseEntity.status(ex.getStatusCode().value()).body(Map.of("error", msg));
        } catch (Exception ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "Erreur interne";
            return ResponseEntity.status(502).body(Map.of("error", msg));
        }
    }

    @GetMapping("/results/{jobId}")
    public ResponseEntity<Map<String, Object>> getResults(@PathVariable String jobId) {
        Map<String, Object> status = scanService.getStatus(jobId);
        return ResponseEntity.ok(status);
    }
}
