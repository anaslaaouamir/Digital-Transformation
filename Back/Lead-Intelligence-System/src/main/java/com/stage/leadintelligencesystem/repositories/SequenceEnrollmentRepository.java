package com.stage.leadintelligencesystem.repositories;

import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.entities.SequenceEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SequenceEnrollmentRepository extends JpaRepository<SequenceEnrollment, Long> {
    // Finds active enrollments due on or before the provided date-time
    @Query("SELECT e FROM SequenceEnrollment e WHERE e.status = 'ACTIVE' AND e.nextExecutionDate <= :endOfToday")
    List<SequenceEnrollment> findAllDueBefore(@Param("endOfToday") LocalDateTime endOfToday);
    // Find the currently running sequence for this lead
    Optional<SequenceEnrollment> findByLeadAndStatus(Lead lead, String status);
}
