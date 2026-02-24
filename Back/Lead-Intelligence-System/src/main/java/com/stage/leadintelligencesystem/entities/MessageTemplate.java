package com.stage.leadintelligencesystem.entities;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "message_templates")
public class MessageTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    // Options: PREMIERE_APPROCHE,RELANCE, OFFRE_VALEUR, DERNIER_FLLOW_UP, SPECIAL PROOF
    private String category;
}
