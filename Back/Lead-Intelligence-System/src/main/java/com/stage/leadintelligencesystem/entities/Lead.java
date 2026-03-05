package com.stage.leadintelligencesystem.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "google_maps_url", nullable = false, unique = true)
    private String googleMapsUrl;

    @Column(name = "company_name")
    private String companyName;

    private String address;
    private String city;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(unique = true)
    private String email;
    private String website;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "employee_count")
    private String employeeCount;

    @Column(name = "revenue_capital")
    private String revenueCapital;

    @Column(name = "google_rating")
    private Double googleRating;

    @Column(name = "google_reviews")
    private Integer googleReviews;

    @Column(name = "price_level")
    private String priceLevel;

    @Column(name = "google_types")
    private String googleTypes;

    @Column(name = "ai_score")
    private Integer aiScore;

    private String temperature;

    @Column(name = "is_enriched")
    private Boolean isEnriched = false;

    // Relational Mapping
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secteur_id")
    @JsonIgnoreProperties("leads")
    private Secteur secteur;

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("lead")
    private List<DecisionMaker> decisionMakers = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Options: NON_CONTACTE, EN_SEQUENCE, TERMINE_SANS_REPONSE, A_REPONDU, MASS_EMAIL_ENVOYE
    private String contactStatus = "NON_CONTACTE";

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("lead")
    private List<Interaction> interactions = new ArrayList<>();

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("lead")
    private List<SequenceEnrollment> sequenceEnrollments = new ArrayList<>();

}
