package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.services.MassActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/actions")
public class MassActionController {

    private final MassActionService massActionService;

    public MassActionController(MassActionService massActionService) {
        this.massActionService = massActionService;
    }

    @PostMapping("/simulate-mass-emails")
    public ResponseEntity<List<SimulatedEmailDto>> simulateMassEmails() {
        List<SimulatedEmailDto> result = massActionService.simulateMassEmails();
        return ResponseEntity.ok(result);
    }


}
