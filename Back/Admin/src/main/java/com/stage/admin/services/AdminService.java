package com.stage.admin.services;

import com.stage.admin.dto.AdminUpdateRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import com.stage.admin.entities.Admin;
import com.stage.admin.repositories.AdminRepository;

@Service
public class AdminService {

    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public Admin getOrCreateAdmin(Jwt jwt) {

        String keycloakId = jwt.getSubject();

        return adminRepository.findByKeycloakId(keycloakId)
                .orElseGet(() ->  createFromJwt(jwt)
                       );
    }

    private Admin createFromJwt(Jwt jwt) {

        return adminRepository.save(
                Admin.builder()
                        .keycloakId(jwt.getSubject())
                        .email(jwt.getClaim("email"))
                        .nom("")
                        .prenom("")
                        .telephone(null)
                        .build()
        );
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



    // Update current admin (business data only)
    public Admin updateCurrentAdmin(String keycloakId, AdminUpdateRequest request) {

        Admin existing = adminRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("ADMIN_NOT_FOUND"));

        if (request.getNom() != null) {
            existing.setNom(request.getNom());
        }

        if (request.getPrenom() != null) {
            existing.setPrenom(request.getPrenom());
        }

        if (request.getTelephone() != null) {
            existing.setTelephone(request.getTelephone());
        }

        //Email update decision:
        // Recommended: do NOT update email here unless you also update it in Keycloak
        if (request.getEmail() != null) {
            existing.setEmail(request.getEmail());
        }

        return adminRepository.save(existing);
    }

}
