package com.stage.admin.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "tiers")
public class Tiers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean estProspect;
    private Boolean estClient;
    private Boolean estFournisseur;

    private String nom;
    private String email;
    private String telephone;

    @Column(name = "date_creation", insertable = false, updatable = false)
    private LocalDateTime dateCreation;

    // getters & setters

    public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public Boolean getEstProspect() {
    return estProspect;
}

public void setEstProspect(Boolean estProspect) {
    this.estProspect = estProspect;
}

public Boolean getEstClient() {
    return estClient;
}

public void setEstClient(Boolean estClient) {
    this.estClient = estClient;
}

public Boolean getEstFournisseur() {
    return estFournisseur;
}

public void setEstFournisseur(Boolean estFournisseur) {
    this.estFournisseur = estFournisseur;
}

public String getNom() {
    return nom;
}

public void setNom(String nom) {
    this.nom = nom;
}

public String getEmail() {
    return email;
}

public void setEmail(String email) {
    this.email = email;
}

public String getTelephone() {
    return telephone;
}

public void setTelephone(String telephone) {
    this.telephone = telephone;
}

public LocalDateTime getDateCreation() {
    return dateCreation;
}

public void setDateCreation(LocalDateTime dateCreation) {
    this.dateCreation = dateCreation;
}

}

