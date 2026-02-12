package com.stage.admin.services;

import org.springframework.stereotype.Service;
import com.stage.admin.entities.Admin;
import com.stage.admin.repositories.AdminRepository;

@Service
public class AdminService {

    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
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

        return adminRepository.save(existing);
    }
}
