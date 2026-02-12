package com.stage.admin.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "employe")
public class Employe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String telephone;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore  // 🔥 THIS HIDES PASSWORD FROM JSON RESPONSES
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Column(nullable = false)
    private String role = "Commercial"; // default value

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ===== Getters & Setters =====

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }

    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }

    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getTelephone() { return telephone; }

    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getEmail() { return email; }

    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }

    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public String getRole() { return role; }

    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
