package com.stage.admin.services;

import com.stage.admin.entities.Employe;
import com.stage.admin.repositories.EmployeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeService {

    private final EmployeRepository employeRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeService(EmployeRepository employeRepository, PasswordEncoder passwordEncoder) {
        this.employeRepository = employeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Employe findById(Long id) {
        return employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
    }

    public List<Employe> getAll(String role) {
        if (role != null && !role.isBlank()) {
            return employeRepository.findByRole(role);
        }
        return employeRepository.findAll();
    }

    public void deleteById(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new RuntimeException("NOT_FOUND");
        }
        employeRepository.deleteById(id);
    }

    //  POST: Add employee
    public Employe create(Employe employe) {
        if (employe.getEmail() == null || employe.getEmail().isBlank()) {
            throw new RuntimeException("EMAIL_REQUIRED");
        }

        if (employeRepository.findByEmail(employe.getEmail()).isPresent()) {
            throw new RuntimeException("EMAIL_EXISTS");
        }

        // default role if empty
        if (employe.getRole() == null || employe.getRole().isBlank()) {
            employe.setRole("Commercial");
        }

        // basic password check
        if (employe.getMotDePasse() == null || employe.getMotDePasse().isBlank()) {
            throw new RuntimeException("PASSWORD_REQUIRED");
        }

        // Validate password strength
        validatePasswordStrength(employe.getMotDePasse());

        // Encrypt password with BCrypt
        employe.setMotDePasse(passwordEncoder.encode(employe.getMotDePasse()));

        return employeRepository.save(employe);
    }

    //  PUT: Update employee
    public Employe update(Long id, Employe data) {
        Employe existing = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));

        // update fields if provided
        if (data.getNom() != null) existing.setNom(data.getNom());
        if (data.getPrenom() != null) existing.setPrenom(data.getPrenom());
        if (data.getTelephone() != null) existing.setTelephone(data.getTelephone());

        // update role (and default if blank)
        if (data.getRole() != null) {
            existing.setRole(data.getRole().isBlank() ? "Commercial" : data.getRole());
        }

        // update email (check uniqueness if changed)
        if (data.getEmail() != null && !data.getEmail().equals(existing.getEmail())) {
            if (employeRepository.findByEmail(data.getEmail()).isPresent()) {
                throw new RuntimeException("EMAIL_EXISTS");
            }
            existing.setEmail(data.getEmail());
        }

        // update password only if provided
        if (data.getMotDePasse() != null && !data.getMotDePasse().isBlank()) {
            // Validate password strength
            validatePasswordStrength(data.getMotDePasse());
            // Encrypt password with BCrypt
            existing.setMotDePasse(passwordEncoder.encode(data.getMotDePasse()));
        }

        return employeRepository.save(existing);
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
