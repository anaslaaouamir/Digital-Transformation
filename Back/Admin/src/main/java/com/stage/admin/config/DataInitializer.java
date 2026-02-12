package com.stage.admin.config;

import com.stage.admin.entity.Admin;
import com.stage.admin.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        String email = "admin@example.com";
        String plain = "password123";

        adminRepository.findByEmail(email).ifPresentOrElse(admin -> {
            admin.setMotDePasse(passwordEncoder.encode(plain));
            adminRepository.save(admin);
            System.out.println("Updated admin password for " + email);
        }, () -> {
            Admin admin = new Admin();
            admin.setNom("Admin");
            admin.setPrenom("Test");
            admin.setEmail(email);
            admin.setTelephone("000000000");
            admin.setMotDePasse(passwordEncoder.encode(plain));
            adminRepository.save(admin);
            System.out.println("Created test admin " + email + " with password '" + plain + "'");
        });
    }
}
