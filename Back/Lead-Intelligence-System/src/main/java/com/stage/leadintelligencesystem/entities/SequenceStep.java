package com.stage.leadintelligencesystem.entities;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "sequence_steps")
public class SequenceStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sequence_id")
    private Sequence sequence;

    @ManyToOne
    @JoinColumn(name = "template_id")
    private MessageTemplate template;

    private Integer stepOrder;
    private Integer delayDays;
}
