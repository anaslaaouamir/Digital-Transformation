package com.stage.leadintelligencesystem.services;

import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.entities.*;
import com.stage.leadintelligencesystem.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SequenceService {

    private final LeadRepository leadRepository;
    private final SequenceRepository sequenceRepository;
    private final SequenceStepRepository stepRepository;
    private final SequenceEnrollmentRepository enrollmentRepository;
    private final InteractionRepository interactionRepository;

    public SequenceService(InteractionRepository interactionRepository,LeadRepository leadRepository, SequenceRepository sequenceRepository,
                           SequenceStepRepository stepRepository, SequenceEnrollmentRepository enrollmentRepository) {
        this.leadRepository = leadRepository;
        this.sequenceRepository = sequenceRepository;
        this.stepRepository = stepRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.interactionRepository=interactionRepository;
    }

    @Transactional
    public SequenceEnrollment startSequenceForLead(Long leadId) {
        // 1. Validate Lead
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // 2. Prevent Double Enrollment
        if ("EN_SEQUENCE".equals(lead.getContactStatus())) {
            throw new RuntimeException("Lead is already in a sequence!");
        }

        // 3. Fetch Default Sequence (ID 1)
        Sequence sequence = sequenceRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default Sequence (ID 1) not found. Did you run the SQL script?"));

        // ====================================================
        // THE SMART SKIP LOGIC
        // ====================================================
        int startStepOrder = 1;

        // If we already sent a Mass Email, skip Step 1 and go straight to Step 2
        if ("MASS_EMAIL_ENVOYE".equals(lead.getContactStatus())) {
            startStepOrder = 2;
        }

        final int finalStepOrder = startStepOrder;
        // 4. Fetch the specific Step configuration to get the delay
        SequenceStep startStep = stepRepository.findBySequenceIdAndStepOrder(sequence.getId(), startStepOrder)
                .orElseThrow(() -> new RuntimeException("Step " + finalStepOrder + " not configured for Sequence ID 1"));

        // 5. Calculate Execution Date
        // If Step 1 (Delay 0) -> Send NOW.
        // If Step 2 (Delay 3) -> Send in 3 days.
        LocalDateTime nextExecution = LocalDateTime.now().plusDays(startStep.getDelayDays());

        // 6. Create Enrollment
        SequenceEnrollment enrollment = new SequenceEnrollment();
        enrollment.setLead(lead);
        enrollment.setSequence(sequence);
        enrollment.setCurrentStepOrder(startStepOrder);
        enrollment.setStatus("ACTIVE");
        enrollment.setNextExecutionDate(nextExecution);

        enrollmentRepository.save(enrollment);

        // 7. Update Lead Status
        lead.setContactStatus("EN_SEQUENCE");
        leadRepository.save(lead);

        return enrollment;
    }

    // Add this to SequenceService.java

    public List<SimulatedEmailDto> processDailyEmails() {
        List<SimulatedEmailDto> emailsToSend = new ArrayList<>();

        // 1. Define "End of Today" to catch everyone due today
        LocalDateTime endOfToday = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        List<SequenceEnrollment> dueEnrollments = enrollmentRepository.findAllDueBefore(endOfToday);

        for (SequenceEnrollment enrollment : dueEnrollments) {
            Lead lead = enrollment.getLead();
            Sequence sequence = enrollment.getSequence();
            int currentStepOrder = enrollment.getCurrentStepOrder();

            // 2. Get the Template for the CURRENT step
            SequenceStep currentStep = stepRepository.findBySequenceIdAndStepOrder(sequence.getId(), currentStepOrder)
                    .orElseThrow(() -> new RuntimeException("Step config missing for Seq " + sequence.getId()));

            MessageTemplate template = currentStep.getTemplate();

            // 3. Personalize Content
            String companyName = (lead.getCompanyName() != null) ? lead.getCompanyName() : "votre entreprise";
            String subject = template.getSubject().replace("{{company}}", companyName);
            String body = template.getBody().replace("{{company}}", companyName);

            // 4. Log the Interaction (Proof it was sent)
            Interaction interaction = new Interaction();
            interaction.setLead(lead);
            interaction.setType("SEQUENCE");
            interaction.setChannel("EMAIL");
            interaction.setStatus("SENT");
            interaction.setSubject(subject);
            interaction.setContent(body);
            interaction.setSentAt(LocalDateTime.now());
            interactionRepository.save(interaction);

            // 5. Add to the list for n8n
            emailsToSend.add(new SimulatedEmailDto(lead.getId(), lead.getEmail(), subject, body));

            // 6. ADVANCE TO NEXT STEP (The "Move Forward" Logic)
            // Check if there is a next step (e.g. Step 1 -> Step 2)
            Optional<SequenceStep> nextStep = stepRepository.findBySequenceIdAndStepOrder(sequence.getId(), currentStepOrder + 1);

            if (nextStep.isPresent()) {
                // Yes, move to next step
                enrollment.setCurrentStepOrder(currentStepOrder + 1);
                // New Date = NOW + Delay of the NEW step
                // Note: We use LocalDateTime.now() to reset the clock to the sending time
                enrollment.setNextExecutionDate(LocalDateTime.now().plusDays(nextStep.get().getDelayDays()));
            } else {
                // No more steps? The sequence is finished.
                enrollment.setStatus("COMPLETED");
                enrollment.setNextExecutionDate(null);

                // Optional: Update Lead status to "TERMINE_SANS_REPONSE"
                lead.setContactStatus("TERMINE_SANS_REPONSE");
                leadRepository.save(lead);
            }
            enrollmentRepository.save(enrollment);
        }

        return emailsToSend;
    }
}