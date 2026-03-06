package com.stage.admin.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tiers")
public class Tiers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- 1. Flags (Nature du Tiers) ---
    private Boolean estProspect = false;
    private Boolean estClient = false;
    private Boolean estFournisseur = false;

    // --- Codes (Auto-generated via Service) ---
    @Column(name = "code_client")
    private String codeClient;

    @Column(name = "code_fournisseur")
    private String codeFournisseur;

    // --- Identification ---
    @Column(nullable = false, unique = true) //  Unicité du nom
    private String nom;

    private String etat = "Ouvert";

    // --- Coordonnées ---
    private String adresse;
    @Column(name = "code_postal")
    private String codePostal;
    private String ville;
    private String pays; // [cite: 108] "Maroc" par défaut (handled in frontend/service)

    @Column(name = "departement_canton")
    private String departementCanton;

    private String telephone;
    private String mobile;
    private String email;
    @Column(name = "site_web")
    private String siteWeb;

    // --- Fiscal / Légal ---
    private String rc;
    @Column(name = "if_fisc")
    private String ifFisc;
    private String cnss;
    private String ice;

    // --- Relations ---
    // Link to the Employe (Commercial) [cite: 57]
    @ManyToOne
    @JoinColumn(name = "commercial_assigne_id")
    private Employe commercialAssigne;

    @Column(name = "date_creation", insertable = false, updatable = false)
    private LocalDateTime dateCreation;

    public Long getId() {
        return id;
    }

    public Boolean getEstProspect() {
        return estProspect;
    }

    public Boolean getEstClient() {
        return estClient;
    }

    public Boolean getEstFournisseur() {
        return estFournisseur;
    }

    public String getCodeClient() {
        return codeClient;
    }

    public String getCodeFournisseur() {
        return codeFournisseur;
    }

    public String getNom() {
        return nom;
    }

    public String getEtat() {
        return etat;
    }

    public String getAdresse() {
        return adresse;
    }

    public String getCodePostal() {
        return codePostal;
    }

    public String getVille() {
        return ville;
    }

    public String getPays() {
        return pays;
    }

    public String getDepartementCanton() {
        return departementCanton;
    }

    public String getTelephone() {
        return telephone;
    }

    public String getMobile() {
        return mobile;
    }

    public String getEmail() {
        return email;
    }

    public String getSiteWeb() {
        return siteWeb;
    }

    public String getRc() {
        return rc;
    }

    public String getIfFisc() {
        return ifFisc;
    }

    public String getCnss() {
        return cnss;
    }

    public String getIce() {
        return ice;
    }

    public Employe getCommercialAssigne() {
        return commercialAssigne;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setEstProspect(Boolean estProspect) {
        this.estProspect = estProspect;
    }

    public void setEstClient(Boolean estClient) {
        this.estClient = estClient;
    }

    public void setEstFournisseur(Boolean estFournisseur) {
        this.estFournisseur = estFournisseur;
    }

    public void setCodeClient(String codeClient) {
        this.codeClient = codeClient;
    }

    public void setCodeFournisseur(String codeFournisseur) {
        this.codeFournisseur = codeFournisseur;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public void setEtat(String etat) {
        this.etat = etat;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public void setCodePostal(String codePostal) {
        this.codePostal = codePostal;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public void setPays(String pays) {
        this.pays = pays;
    }

    public void setDepartementCanton(String departementCanton) {
        this.departementCanton = departementCanton;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setSiteWeb(String siteWeb) {
        this.siteWeb = siteWeb;
    }

    public void setRc(String rc) {
        this.rc = rc;
    }

    public void setIfFisc(String ifFisc) {
        this.ifFisc = ifFisc;
    }

    public void setCnss(String cnss) {
        this.cnss = cnss;
    }

    public void setIce(String ice) {
        this.ice = ice;
    }

    public void setCommercialAssigne(Employe commercialAssigne) {
        this.commercialAssigne = commercialAssigne;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}