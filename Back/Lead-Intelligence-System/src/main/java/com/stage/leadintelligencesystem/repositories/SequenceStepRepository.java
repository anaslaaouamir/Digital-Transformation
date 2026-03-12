package com.stage.leadintelligencesystem.repositories;

import com.stage.leadintelligencesystem.entities.SequenceStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SequenceStepRepository extends JpaRepository<SequenceStep, Long> {

    Optional<SequenceStep> findBySequenceIdAndStepOrder(Long sequenceId, Integer stepOrder);

    Optional<SequenceStep> findByTemplateId(Long templateId);

}
