package com.stage.admin.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.stage.admin.dto.AdminResponse;
import com.stage.admin.entities.Admin;
import com.stage.admin.services.AdminService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // Convert Admin to AdminResponse (without password)
    private AdminResponse mapToResponse(Admin admin) {
        if (admin == null) return null;
        return new AdminResponse(
            admin.getId(),
            admin.getNom(),
            admin.getPrenom(),
            admin.getTelephone(),
            admin.getEmail(),
            admin.getCreatedAt()
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        Admin admin = adminService.getCurrentAdmin();
        if (admin == null) {
            return ResponseEntity.status(404).body("{\"error\": \"Admin not found\"}");
        }
        return ResponseEntity.ok(mapToResponse(admin));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody Admin admin) {
        try {
            Admin updated = adminService.updateCurrentAdmin(admin);
            if (updated == null) {
                return ResponseEntity.status(404).body("{\"error\": \"Admin not found\"}");
            }
            return ResponseEntity.ok(mapToResponse(updated));
        } catch (RuntimeException e) {
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
}
