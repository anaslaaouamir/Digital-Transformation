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
        // This triggers the service to call Flask and start the @Async polling loop
        String jobId = scanService.initiateScan(request);

        // Returns HTTP 202 (Accepted) immediately, meaning "processing started in background"
        return ResponseEntity.accepted().body(Map.of("job_id", jobId));
    }

    @GetMapping("/results/{jobId}")
    public ResponseEntity<Map<String, Object>> getResults(@PathVariable String jobId) {
        Map<String, Object> status = scanService.getStatus(jobId);
        return ResponseEntity.ok(status);
    }
}
