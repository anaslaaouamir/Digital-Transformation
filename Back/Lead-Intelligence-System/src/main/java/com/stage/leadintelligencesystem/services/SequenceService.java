package com.stage.leadintelligencesystem.services;

import com.stage.leadintelligencesystem.dto.IncomingReplyDto;
import com.stage.leadintelligencesystem.dto.SimulatedEmailDto;
import com.stage.leadintelligencesystem.entities.*;
import com.stage.leadintelligencesystem.repositories.*;
import org.springframework.beans.factory.annotation.Value;
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
    @Value("${app.tracking.url}")
    private String trackingBaseUrl;

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
            String body = template.getBody().replace("{{company}}", companyName).replace("\n", "<br>");;

            // 4. Log the Interaction (Proof it was sent)
            Interaction interaction = new Interaction();
            interaction.setLead(lead);
            interaction.setType("SEQUENCE");
            interaction.setChannel("EMAIL");
            interaction.setStatus("SENT");
            interaction.setSubject(subject);
            interaction.setContent(body);
            interaction.setSentAt(LocalDateTime.now());

            // IMPORTANT CHANGE: Reassign the saved entity to capture the generated ID
            interaction = interactionRepository.save(interaction);

            // ---> 4.5 INJECT THE SPY PIXEL <---
            //String trackingUrl = "https://info-contribution-aims-lightweight.trycloudflare.com/api/tracking/open/" + interaction.getId();
            String trackingUrl = trackingBaseUrl+ "/api/tracking/open/" + interaction.getId();
            String pixelHtml = "<img src=\"" + trackingUrl + "\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\"/>";

            String finalBodyWithPixel = body + "<br>" + pixelHtml;

            // Update the DB content to include the exact HTML sent
            interaction.setContent(finalBodyWithPixel);
            interactionRepository.save(interaction);

            // 5. Add to the list for n8n
            // IMPORTANT CHANGE: Send finalBodyWithPixel to n8n, not the original body
            emailsToSend.add(new SimulatedEmailDto(lead.getId(), lead.getEmail(), subject, finalBodyWithPixel));

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

    @Transactional
    public void processIncomingReply(IncomingReplyDto replyDto) {
        // 1. Find the Lead
        Lead lead = leadRepository.findByEmail(replyDto.getEmail())
                .orElseThrow(() -> new RuntimeException("Lead not found: " + replyDto.getEmail()));

        // 2. GLOBAL STATUS UPDATE (For ALL types: Masse, Manual, Sequence...)
        // If they reply, they are no longer "Non contacté" or "En sequence".
        if (!"A_REPONDU".equals(lead.getContactStatus())) {
            lead.setContactStatus("A_REPONDU");
            leadRepository.save(lead);
        }

        // 3. STOP SEQUENCE (Only if applicable)
        // Even if they replied to a "Mass Email", we should ensure no sequence starts later.
        Optional<SequenceEnrollment> activeEnrollment = enrollmentRepository.findByLeadAndStatus(lead, "ACTIVE");
        if (activeEnrollment.isPresent()) {
            SequenceEnrollment enrollment = activeEnrollment.get();
            enrollment.setStatus("CANCELLED");
            enrollment.setNextExecutionDate(null);
            enrollmentRepository.save(enrollment);
        }

        // 4. FIND THE MATCHING SENT EMAIL
        Interaction matchedInteraction = null;

        // A. Clean the subject (Remove prefixes to get the core topic)
        String cleanSubject = replyDto.getSubject()
                .replaceAll("(?i)^(Re|Fwd|Rép|Rép\\.|Tr):\\s*", "")
                .trim();

        // B. Search for a Sent Email that contains this core subject
        // NOW WE USE THE VARIABLE:
        List<Interaction> matches = interactionRepository.findBySubjectMatch(lead, cleanSubject);

        if (!matches.isEmpty()) {
            // Found a match! The first one is the most recent due to ORDER BY DESC
            matchedInteraction = matches.get(0);
        } else {
            // C. Fallback: If no subject match, just take the very last email sent
            matchedInteraction = interactionRepository
                    .findTopByLeadAndChannelAndStatusInOrderBySentAtDesc(lead, "EMAIL", List.of("SENT", "OPENED"))
                    .orElse(null);
        }

        // 5. UPDATE THE ORIGINAL MESSAGE (Mark it as the "winner")
        if (matchedInteraction != null) {
            matchedInteraction.setStatus("REPLIED");
            matchedInteraction.setRepliedAt(replyDto.getRepliedAt()); // Or use replyDto.getRepliedAt()
            interactionRepository.save(matchedInteraction);

            // 6. LOG THE NEW RESPONSE
            Interaction responseInteraction = new Interaction();
            responseInteraction.setLead(lead);
            responseInteraction.setChannel("EMAIL");
            responseInteraction.setType("RESPONSE"); // The new type
            responseInteraction.setStatus("RECEIVED");
            responseInteraction.setSubject(replyDto.getSubject()); // Original subject with "Re:"
            responseInteraction.setContent(replyDto.getEmailBody());
            responseInteraction.setSentAt(replyDto.getRepliedAt());

            interactionRepository.save(responseInteraction);
        }


    }

    @Transactional
    public void handleBouncedEmail(String email) {
        if ("unknown_bounce".equals(email)) {
            throw new RuntimeException("Could not extract bounced email address from payload.");
        }

        Lead lead = leadRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Lead not found for bounce: " + email));

        // 1. Update Lead Status
        lead.setContactStatus("BOUNCED_EMAIL");
        leadRepository.save(lead);

        // 2. Cancel Active Sequence
        Optional<SequenceEnrollment> activeEnrollment = enrollmentRepository.findByLeadAndStatus(lead, "ACTIVE");
        if (activeEnrollment.isPresent()) {
            SequenceEnrollment enrollment = activeEnrollment.get();
            enrollment.setStatus("CANCELLED");
            enrollment.setNextExecutionDate(null);
            enrollmentRepository.save(enrollment);
        }

        // 3. Update ONLY the most recent SENT interaction
        // We target only the last email sent, preserving historical data
        interactionRepository.findTopByLeadAndChannelAndStatusInOrderBySentAtDesc(
                lead, "EMAIL", List.of("SENT")
        ).ifPresent(interaction -> {
            interaction.setStatus("BOUNCED");
            interactionRepository.save(interaction);
        });
    }




    @Transactional
    public void cancelSequenceForLead(Long leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + leadId));

        SequenceEnrollment enrollment = enrollmentRepository
                .findByLeadAndStatus(lead, "ACTIVE")
                .or(() -> enrollmentRepository.findByLeadAndStatus(lead, "PAUSED"))
                .orElseThrow(() -> new RuntimeException("No active sequence found for lead: " + leadId));

        enrollment.setStatus("CANCELLED");
        enrollment.setNextExecutionDate(null);
        enrollmentRepository.save(enrollment);

        // Determine new status based on last outbound interaction
        String newStatus = interactionRepository
                .findTopByLeadAndTypeNotOrderBySentAtDesc(lead, "RESPONSE")
                .map(last -> {
                    String channel = String.valueOf(last.getChannel()).toUpperCase();
                    String type    = String.valueOf(last.getType()).toUpperCase();
                    String status  = String.valueOf(last.getStatus()).toUpperCase();

                    if ("REPLIED".equals(status) || "A_REPONDU".equals(lead.getContactStatus())) {
                        return "A_REPONDU";
                    }
                    return switch (type) {
                        case "MASSE"        -> "EMAIL".equals(channel) ? "MASS_EMAIL_ENVOYE"    : "MASS_WHATSAPP_ENVOYE";
                        case "MANUAL"       -> "EMAIL".equals(channel) ? "MANUAL_EMAIL_ENVOYE"  : "MANUAL_WHATSAPP_ENVOYE";
                        case "AI_GENERATED" -> "EMAIL".equals(channel) ? "AI_EMAIL_ENVOYE"      : "AI_WHATSAPP_ENVOYE";
                        case "SEQUENCE"     -> "EMAIL".equals(channel) ? "MANUAL_EMAIL_ENVOYE"  : "MANUAL_WHATSAPP_ENVOYE";
                        default             -> "NON_CONTACTE";
                    };
                })
                .orElse("NON_CONTACTE");

        lead.setContactStatus(newStatus);
        leadRepository.save(lead);
    }
}