package com.stage.leadintelligencesystem.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "interactions")
public class Interaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lead_id")
    @JsonIgnoreProperties({"interactions", "decisionMakers", "secteur"})
    private Lead lead;

    // Options: EMAIL, WHATSAPP
    private String channel;

    // Options: MANUAL, SEQUENCE, AI_GENERATED, MASSE, RESPONSE
    private String type;

    // Options:  SENT, OPENED, REPLIED, BOUNCED
    private String status;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime openedAt;
    private LocalDateTime repliedAt;
}
