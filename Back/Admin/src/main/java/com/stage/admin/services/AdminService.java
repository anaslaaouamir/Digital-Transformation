package com.stage.admin.services;

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

    public Admin updateCurrentAdmin(Admin updatedAdmin) {
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
