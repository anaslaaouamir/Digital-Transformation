package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.services.MassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/actions")
@CrossOrigin(origins = "*")
public class MassActionController {

    private final MassActionService massActionService;

    public MassActionController(MassActionService massActionService) {
        this.massActionService = massActionService;
    }

    @PostMapping("/simulate-mass-emails")
    public ResponseEntity<?> simulateMassEmails() { // Changed to <?>
        try {
            List<SimulatedEmailDto> result = massActionService.simulateMassEmails();
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            // If n8n is down, this returns the exact error message we wrote in the service
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping(value = "/send-manual-email", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> sendManualEmail(
            @RequestPart("email")   String email,
            @RequestPart("subject") String subject,
            @RequestPart("body")    String body,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        try {
            massActionService.sendManualEmail(email, subject, body, files);
            return ResponseEntity.ok("Manual email sent and tracked successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


}
