package com.stage.admin.controllers;

import com.stage.admin.entities.Employe;
import com.stage.admin.services.EmployeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employes")
public class EmployeController {

    private final EmployeService employeService;

    public EmployeController(EmployeService employeService) {
        this.employeService = employeService;
    }

    // ✅ GET /api/employes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getEmployeById(@PathVariable Long id) {
        try {
            Employe employe = employeService.findById(id);
            return ResponseEntity.ok(employe); // @JsonIgnore hides the password automatically
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("{\"error\": \"Employe not found\"}");
        }
    }

    // ✅ GET /api/employes?role=Commercial

    @GetMapping
    public ResponseEntity<List<Employe>> getAllEmployes(@RequestParam(required = false) String role) {
        List<Employe> employes = employeService.getAll(role);
        return ResponseEntity.ok(employes);
    }

// ✅ POST /api/employes
@PostMapping
public ResponseEntity<?> createEmploye(@RequestBody Employe employe) {
    try {
        Employe saved = employeService.create(employe);
        return ResponseEntity.ok(saved); // password hidden by @JsonIgnore
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
        return ResponseEntity.status(400).body("{\"error\":\"Bad request\"}");
    }
}

// ✅ PUT /api/employes/{id}
@PutMapping("/{id}")
public ResponseEntity<?> updateEmploye(@PathVariable Long id, @RequestBody Employe employe) {
    try {
        Employe updated = employeService.update(id, employe);
        return ResponseEntity.ok(updated); // password hidden by @JsonIgnore
    } catch (RuntimeException e) {
        if ("NOT_FOUND".equals(e.getMessage())) {
            return ResponseEntity.status(404).body("{\"error\":\"Employe not found\"}");
        }
        if ("EMAIL_EXISTS".equals(e.getMessage())) {
            return ResponseEntity.status(400).body("{\"error\":\"Email already exists\"}");
        }
        return ResponseEntity.status(400).body("{\"error\":\"Bad request\"}");
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
