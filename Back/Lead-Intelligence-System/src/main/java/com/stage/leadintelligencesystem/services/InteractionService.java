package com.stage.leadintelligencesystem.services;

import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.entities.SequenceEnrollment;
import com.stage.leadintelligencesystem.repositories.InteractionRepository;
import com.stage.leadintelligencesystem.repositories.SequenceEnrollmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InteractionService {

    private final InteractionRepository interactionRepository;
    private final SequenceEnrollmentRepository sequenceEnrollmentRepository;

    public InteractionService(InteractionRepository interactionRepository,
                              SequenceEnrollmentRepository sequenceEnrollmentRepository) {
        this.interactionRepository = interactionRepository;
        this.sequenceEnrollmentRepository = sequenceEnrollmentRepository;
    }

    // --- Interaction Methods ---

    public List<Interaction> getAllInteractions() {
        return interactionRepository.findAll();
    }

    public Optional<Interaction> getInteractionById(Long id) {
        return interactionRepository.findById(id);
    }

    public List<Interaction> getInteractionsByLeadId(Long leadId) {
        return interactionRepository.findByLeadId(leadId);
    }

    // --- Sequence Enrollment Methods ---

    public List<SequenceEnrollment> getAllSequences() {
        return sequenceEnrollmentRepository.findAll();
    }

    public Optional<SequenceEnrollment> getSequenceById(Long id) {
        return sequenceEnrollmentRepository.findById(id);
    }

    public List<SequenceEnrollment> getActiveSequences() {
        return sequenceEnrollmentRepository.findByStatus("ACTIVE");
    }

    public List<SequenceEnrollment> getSequencesByLeadId(Long leadId) {
        return sequenceEnrollmentRepository.findByLeadId(leadId);
    }

    public Optional<Interaction> getResponseForInteraction(Long id) {
        return interactionRepository.findById(id).flatMap(original -> {
            // 1. Verify if the interaction status is REPLIED and has a timestamp
            if (!"REPLIED".equals(original.getStatus()) || original.getRepliedAt() == null) {
                return Optional.empty();
            }

            // 2. Find the interaction where sentAt matches the reply time AND type is "RESPONSE"
            return interactionRepository.findBySentAtAndType(original.getRepliedAt(), "RESPONSE");
        });
    }
}