package com.stage.leadintelligencesystem.repositories;

import com.stage.leadintelligencesystem.entities.Sequence;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SequenceRepository extends JpaRepository<Sequence, Long> {
}
