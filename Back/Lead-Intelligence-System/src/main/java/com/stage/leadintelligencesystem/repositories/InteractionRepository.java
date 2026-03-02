package com.stage.leadintelligencesystem.repositories;

import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.entities.MessageTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InteractionRepository extends JpaRepository<Interaction, Long> {
    // Standard method to find the last email sent
    Optional<Interaction> findTopByLeadAndChannelAndStatusInOrderBySentAtDesc(
            Lead lead,
            String channel,
            List<String> statuses
    );
    // MATCHING LOGIC: Find an email where the subject matches our "clean" version
    // We look for emails where the subject is LIKE %cleanSubject%
    @Query("SELECT i FROM Interaction i WHERE i.lead = :lead AND i.status = 'SENT' AND i.subject LIKE %:cleanSubject% ORDER BY i.sentAt DESC")
    List<Interaction> findBySubjectMatch(@Param("lead") Lead lead, @Param("cleanSubject") String cleanSubject);

}
