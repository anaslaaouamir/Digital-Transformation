package com.stage.admin.services;

import com.stage.admin.dto.AdminUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.stage.admin.entities.Admin;
import com.stage.admin.repositories.AdminRepository;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Admin getCurrentAdmin() {
        // retourne le premier admin pour l’instant
        return adminRepository.findAll().stream().findFirst().orElse(null);
    }

    /*public Admin updateCurrentAdmin(Admin updatedAdmin) {
        Admin existing = getCurrentAdmin();
        if (existing == null) return null;

        existing.setNom(updatedAdmin.getNom());
        existing.setPrenom(updatedAdmin.getPrenom());
        existing.setEmail(updatedAdmin.getEmail());
        existing.setTelephone(updatedAdmin.getTelephone());

        // update password if provided
        if (updatedAdmin.getMotDePasse() != null && !updatedAdmin.getMotDePasse().isBlank()) {
            validatePasswordStrength(updatedAdmin.getMotDePasse());
            existing.setMotDePasse(passwordEncoder.encode(updatedAdmin.getMotDePasse()));
        }

        return adminRepository.save(existing);
    }*/



    // Changed signature to accept DTO instead of Entity
    public Admin updateCurrentAdmin(AdminUpdateRequest request) {
        Admin existing = getCurrentAdmin();
        if (existing == null) {
            throw new RuntimeException("ADMIN_NOT_FOUND");
        }

        // 1. SECURITY CHECK: Validate the Current Password
        // We cannot trust the update unless they prove they know the old password
        if (request.getCurrentPassword() == null ||
                !passwordEncoder.matches(request.getCurrentPassword(), existing.getMotDePasse())) {
            throw new RuntimeException("INVALID_CURRENT_PASSWORD");
        }

        // 2. Update Basic Info
        existing.setNom(request.getNom());
        existing.setPrenom(request.getPrenom());
        existing.setEmail(request.getEmail());
        existing.setTelephone(request.getTelephone());

        // 3. Handle Password Change (If new password is provided)
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            // Check if new password is the same as old (optional, but good practice)
            if (passwordEncoder.matches(request.getNewPassword(), existing.getMotDePasse())) {
                throw new RuntimeException("NEW_PASSWORD_SAME_AS_OLD");
            }

            // Validate and Encode
            validatePasswordStrength(request.getNewPassword());
            existing.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
        }

        return adminRepository.save(existing);
    }

    // Password strength validation
    private void validatePasswordStrength(String password) {
        if (password.length() < 8) {
            throw new RuntimeException("PASSWORD_TOO_SHORT");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("PASSWORD_MISSING_UPPERCASE");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new RuntimeException("PASSWORD_MISSING_LOWERCASE");
        }
        if (!password.matches(".*\\d.*")) {
            throw new RuntimeException("PASSWORD_MISSING_DIGIT");
        }
    }
}
