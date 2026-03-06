package com.stage.leadintelligencesystem.entities;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Entity
@Getter
@Setter
@Table(name = "sequence_enrollments")
public class SequenceEnrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lead_id")
    @JsonIgnoreProperties({"sequenceEnrollments", "interactions", "decisionMakers"})
    private Lead lead;

    @ManyToOne
    @JoinColumn(name = "sequence_id")
    private Sequence sequence;

    private Integer currentStepOrder;

    // Options: ACTIVE, PAUSED, COMPLETED, CANCELLED
    private String status = "ACTIVE";

    private LocalDateTime nextExecutionDate;
}
