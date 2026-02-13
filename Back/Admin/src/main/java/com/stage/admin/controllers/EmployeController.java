package com.stage.admin.controllers;

import com.stage.admin.dto.EmployeResponse;
import com.stage.admin.entities.Employe;
import com.stage.admin.services.EmployeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employes")
public class EmployeController {

    private final EmployeService employeService;

    public EmployeController(EmployeService employeService) {
        this.employeService = employeService;
    }

    // Convert Employe to EmployeResponse (without password)
    private EmployeResponse mapToResponse(Employe employe) {
        return new EmployeResponse(
            employe.getId(),
            employe.getNom(),
            employe.getPrenom(),
            employe.getTelephone(),
            employe.getEmail(),
            employe.getRole(),
            employe.getCreatedAt()
        );
    }

    // ✅ GET /api/employes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getEmployeById(@PathVariable Long id) {
        try {
            Employe employe = employeService.findById(id);
            return ResponseEntity.ok(mapToResponse(employe));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("{\"error\": \"Employe not found\"}");
        }
    }

    // ✅ GET /api/employes?role=Commercial
    @GetMapping
    public ResponseEntity<List<EmployeResponse>> getAllEmployes(@RequestParam(required = false) String role) {
        List<Employe> employes = employeService.getAll(role);
        List<EmployeResponse> responses = employes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    // ✅ POST /api/employes
    @PostMapping
    public ResponseEntity<?> createEmploye(@RequestBody Employe employe) {
        try {
            Employe saved = employeService.create(employe);
            return ResponseEntity.ok(mapToResponse(saved));
        } catch (RuntimeException e) {
            if ("EMAIL_EXISTS".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Email already exists\"}");
            }
            if ("EMAIL_REQUIRED".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Email is required\"}");
            }
            if ("PASSWORD_REQUIRED".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password is required\"}");
            }
            if ("PASSWORD_TOO_SHORT".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must be at least 8 characters\"}");
            }
            if ("PASSWORD_MISSING_UPPERCASE".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must contain at least one uppercase letter\"}");
            }
            if ("PASSWORD_MISSING_LOWERCASE".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must contain at least one lowercase letter\"}");
            }
            if ("PASSWORD_MISSING_DIGIT".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must contain at least one digit\"}");
            }
            return ResponseEntity.status(400).body("{\"error\":\"Bad request: " + e.getMessage() + "\"}");
        }
    }

    // ✅ PUT /api/employes/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmploye(@PathVariable Long id, @RequestBody Employe employe) {
        try {
            Employe updated = employeService.update(id, employe);
            return ResponseEntity.ok(mapToResponse(updated));
        } catch (RuntimeException e) {
            if ("NOT_FOUND".equals(e.getMessage())) {
                return ResponseEntity.status(404).body("{\"error\":\"Employe not found\"}");
            }
            if ("EMAIL_EXISTS".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Email already exists\"}");
            }
            if ("PASSWORD_TOO_SHORT".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must be at least 8 characters\"}");
            }
            if ("PASSWORD_MISSING_UPPERCASE".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must contain at least one uppercase letter\"}");
            }
            if ("PASSWORD_MISSING_LOWERCASE".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must contain at least one lowercase letter\"}");
            }
            if ("PASSWORD_MISSING_DIGIT".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\":\"Password must contain at least one digit\"}");
            }
            return ResponseEntity.status(400).body("{\"error\":\"Bad request: " + e.getMessage() + "\"}");
        }
    }

    // ✅ DELETE /api/employes/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmploye(@PathVariable Long id) {
        try {
            employeService.deleteById(id);
            return ResponseEntity.ok().body("{\"message\": \"Employe deleted\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("{\"error\": \"Employe not found\"}");
        }
    }
}
