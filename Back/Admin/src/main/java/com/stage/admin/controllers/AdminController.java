package com.stage.admin.controllers;

import com.stage.admin.dto.AdminUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.stage.admin.dto.AdminResponse;
import com.stage.admin.entities.Admin;
import com.stage.admin.services.AdminService;

@RestController
@RequestMapping("/api/admin")
// ## j'ai commenter la configuration de cros car la configuration maintenant il faut le faire dans la gatway service
//@CrossOrigin(origins = "*") // Allows your React frontend to communicate with this API

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
    public ResponseEntity<AdminResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
        Admin admin = adminService.getOrCreateAdmin(jwt);
        return ResponseEntity.ok(mapToResponse(admin));
    }

    // Update current authenticated admin (business data only)
    @PutMapping("/me")
    public ResponseEntity<AdminResponse> updateMe(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AdminUpdateRequest request) {

        String keycloakId = jwt.getSubject();

        Admin updated = adminService.updateCurrentAdmin(keycloakId, request);

        return ResponseEntity.ok(mapToResponse(updated));
    }

}
