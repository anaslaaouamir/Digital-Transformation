package com.stage.admin.service;

import com.stage.admin.dto.LoginRequest;
import com.stage.admin.dto.LoginResponse;
import com.stage.admin.entity.Admin;
import com.stage.admin.repository.AdminRepository;
import com.stage.admin.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private JwtProvider jwtProvider;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public LoginResponse login(LoginRequest request) {
        // Check if admin exists by email
        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Admin not found with email: " + request.getEmail()));
        
        // Validate password
        if (!passwordEncoder.matches(request.getMotDePasse(), admin.getMotDePasse())) {
            throw new RuntimeException("Invalid password");
        }
        
        // Generate JWT token
        String token = jwtProvider.generateToken(admin.getId(), admin.getEmail());
        
        // Return response with token and admin info
        return new LoginResponse(
            token,
            admin.getId(),
            admin.getNom(),
            admin.getPrenom(),
            admin.getEmail()
        );
    }
}
