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

    // ✅ GET /api/employes?role=Commercial
    @GetMapping
    public ResponseEntity<List<Employe>> getAllEmployes(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(employeService.getAll(role));
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
