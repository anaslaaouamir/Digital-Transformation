package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.entities.*;
import com.stage.leadintelligencesystem.repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leads")
@CrossOrigin(origins = "*")
public class LeadsController {

    // ── ORIGINAL field ────────────────────────────────────────────────────────
    private final LeadRepository leadRepository;

    // ── NEW fields (added for lead edit & sequence status features) ───────────
    private final SecteurRepository            secteurRepository;
    private final DecisionMakerRepository      decisionMakerRepository;
    private final SequenceEnrollmentRepository enrollmentRepository;
    private final SequenceStepRepository       stepRepository;

    // ── ORIGINAL constructor was:
    //      public LeadsController(LeadRepository leadRepository) {
    //          this.leadRepository = leadRepository;
    //      }
    //    Replaced below with extended version — Spring will autowire all repos ─
    // ── NEW constructor ───────────────────────────────────────────────────────
    public LeadsController(LeadRepository leadRepository,
                           SecteurRepository secteurRepository,
                           DecisionMakerRepository decisionMakerRepository,
                           SequenceEnrollmentRepository enrollmentRepository,
                           SequenceStepRepository stepRepository) {
        this.leadRepository          = leadRepository;
        this.secteurRepository       = secteurRepository;
        this.decisionMakerRepository = decisionMakerRepository;
        this.enrollmentRepository    = enrollmentRepository;
        this.stepRepository          = stepRepository;
    }

    // =========================================================================
    // ORIGINAL DTO — kept exactly as-is, only additive fields appended at bottom
    // =========================================================================
    static class LeadDTO {
        // ── ORIGINAL fields — NOT TOUCHED ────────────────────────────────────
        public Long    id;
        public String  companyName;
        public String  city;
        public String  phoneNumber;
        public String  email;
        public String  website;
        public String  linkedinUrl;
        public Double  googleRating;
        public Integer googleReviews;
        public Integer aiScore;
        public String  temperature;
        public String  secteurName;
        public String  contactStatus;

        // ── NEW fields appended (additive — no existing consumer breaks) ─────
        public String  address;
        public Long    secteurId;
        public String  employeeCount;
        public String  revenueCapital;
        public List<DecisionMakerDTO> decisionMakers;

        LeadDTO(Lead l) {
            // ── ORIGINAL mappings — NOT TOUCHED ──────────────────────────────
            this.id            = l.getId();
            this.companyName   = l.getCompanyName();
            this.city          = l.getCity();
            this.phoneNumber   = l.getPhoneNumber();
            this.email         = l.getEmail();
            this.website       = l.getWebsite();
            this.linkedinUrl   = l.getLinkedinUrl();
            this.googleRating  = l.getGoogleRating();
            this.googleReviews = l.getGoogleReviews();
            this.aiScore       = l.getAiScore();
            this.temperature   = l.getTemperature();
            this.secteurName   = l.getSecteur() != null ? l.getSecteur().getName() : null;
            this.contactStatus = l.getContactStatus();

            // ── NEW mappings ──────────────────────────────────────────────────
            this.address        = l.getAddress();
            this.secteurId      = l.getSecteur() != null ? l.getSecteur().getId() : null;
            this.employeeCount  = l.getEmployeeCount();
            this.revenueCapital = l.getRevenueCapital();
            this.decisionMakers = l.getDecisionMakers()
                    .stream().map(DecisionMakerDTO::new).collect(Collectors.toList());
        }
    }

    // =========================================================================
    // NEW DTOs (did not exist before)
    // =========================================================================

    static class DecisionMakerDTO {
        public Long   id;
        public String fullName;
        public String title;
        public String email;
        public String directPhone;
        public String linkedinUrl;

        DecisionMakerDTO(DecisionMaker dm) {
            this.id          = dm.getId();
            this.fullName    = dm.getFullName();
            this.title       = dm.getTitle();
            this.email       = dm.getEmail();
            this.directPhone = dm.getDirectPhone();
            this.linkedinUrl = dm.getLinkedinUrl();
        }
    }

    static class SecteurDTO {
        public Long   id;
        public String name;
        SecteurDTO(Secteur s) { this.id = s.getId(); this.name = s.getName(); }
    }

    static class EnrollmentDTO {
        public Long   id;
        public String sequenceName;
        public int    currentStepOrder;
        public int    totalSteps;
        public String currentStepName;
        public String nextExecutionDate; // ISO datetime string, null if no next send
        public String status;

        EnrollmentDTO(SequenceEnrollment e, int totalSteps, String currentStepName) {
            DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            this.id                = e.getId();
            this.sequenceName      = e.getSequence().getName();
            this.currentStepOrder  = e.getCurrentStepOrder();
            this.totalSteps        = totalSteps;
            this.currentStepName   = currentStepName;
            this.nextExecutionDate = e.getNextExecutionDate() != null
                    ? e.getNextExecutionDate().format(fmt) : null;
            this.status            = e.getStatus();
        }
    }

    // =========================================================================
    // NEW request bodies (did not exist before)
    // =========================================================================

    static class UpdateLeadRequest {
        public String companyName;
        public String address;
        public String city;
        public String phoneNumber;
        public String email;
        public String website;
        public String linkedinUrl;
        public String employeeCount;
        public String revenueCapital;
        public String temperature;
        public Long   secteurId;
        // NOTE: googleMapsUrl, googleRating, googleReviews, googleTypes,
        //       aiScore, isEnriched, contactStatus are intentionally excluded —
        //       they must not be editable from the front end
    }

    static class DecisionMakerRequest {
        public String fullName;
        public String title;
        public String email;
        public String directPhone;
        public String linkedinUrl;
    }

    // =========================================================================
    // ORIGINAL endpoints — NOT TOUCHED
    // =========================================================================

    @GetMapping
    public List<LeadDTO> list() {
        return leadRepository.findAll()
                .stream()
                .map(LeadDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public LeadDTO get(@PathVariable Long id) {
        Lead l = leadRepository.findById(id).orElse(null);
        return l != null ? new LeadDTO(l) : null;
    }

    // =========================================================================
    // NEW endpoints (did not exist before)
    // =========================================================================

    // List all secteurs — used to populate the sector dropdown in the edit form
    @GetMapping("/secteurs")
    public List<SecteurDTO> listSecteurs() {
        return secteurRepository.findAll()
                .stream().map(SecteurDTO::new).collect(Collectors.toList());
    }

    // Returns the active/paused enrollment for a lead with step details.
    // Returns 204 No Content if the lead has no active sequence.
    @GetMapping("/{id}/enrollment")
    public ResponseEntity<?> getActiveEnrollment(@PathVariable Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return enrollmentRepository.findByLeadAndStatus(lead, "ACTIVE")
                .or(() -> enrollmentRepository.findByLeadAndStatus(lead, "PAUSED"))
                .map(enrollment -> {
                    Long seqId = enrollment.getSequence().getId();

                    int totalSteps = (int) stepRepository.findAll().stream()
                            .filter(s -> s.getSequence().getId().equals(seqId))
                            .count();

                    String currentStepName = stepRepository
                            .findBySequenceIdAndStepOrder(seqId, enrollment.getCurrentStepOrder())
                            .map(s -> s.getTemplate().getName())
                            .orElse("Étape " + enrollment.getCurrentStepOrder());

                    return ResponseEntity.ok(new EnrollmentDTO(enrollment, totalSteps, currentStepName));
                })
                .orElse(ResponseEntity.noContent().build());
    }

    // Updates only the editable fields of a lead.
    // Fields NOT included in UpdateLeadRequest are never touched.
    @PutMapping("/{id}")
    public LeadDTO update(@PathVariable Long id, @RequestBody UpdateLeadRequest req) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (req.companyName    != null) lead.setCompanyName(req.companyName);
        if (req.address        != null) lead.setAddress(req.address);
        if (req.city           != null) lead.setCity(req.city);
        if (req.phoneNumber    != null) lead.setPhoneNumber(req.phoneNumber);
        if (req.email          != null) lead.setEmail(req.email);
        if (req.website        != null) lead.setWebsite(req.website);
        if (req.linkedinUrl    != null) lead.setLinkedinUrl(req.linkedinUrl);
        if (req.employeeCount  != null) lead.setEmployeeCount(req.employeeCount);
        if (req.revenueCapital != null) lead.setRevenueCapital(req.revenueCapital);
        if (req.temperature    != null) lead.setTemperature(req.temperature);

        if (req.secteurId != null) {
            Secteur secteur = secteurRepository.findById(req.secteurId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Secteur not found: " + req.secteurId));
            lead.setSecteur(secteur);
        }

        return new LeadDTO(leadRepository.save(lead));
    }

    // Adds a new decision maker linked to a lead
    @PostMapping("/{leadId}/decision-makers")
    @ResponseStatus(HttpStatus.CREATED)
    public DecisionMakerDTO addDecisionMaker(@PathVariable Long leadId,
                                             @RequestBody DecisionMakerRequest req) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        DecisionMaker dm = new DecisionMaker();
        dm.setLead(lead);
        dm.setFullName(req.fullName);
        dm.setTitle(req.title);
        dm.setEmail(req.email);
        dm.setDirectPhone(req.directPhone);
        dm.setLinkedinUrl(req.linkedinUrl);
        return new DecisionMakerDTO(decisionMakerRepository.save(dm));
    }

    // Updates an existing decision maker
    @PutMapping("/{leadId}/decision-makers/{dmId}")
    public DecisionMakerDTO updateDecisionMaker(@PathVariable Long leadId,
                                                @PathVariable Long dmId,
                                                @RequestBody DecisionMakerRequest req) {
        DecisionMaker dm = decisionMakerRepository.findById(dmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!dm.getLead().getId().equals(leadId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Decision maker does not belong to this lead");
        if (req.fullName    != null) dm.setFullName(req.fullName);
        if (req.title       != null) dm.setTitle(req.title);
        if (req.email       != null) dm.setEmail(req.email);
        if (req.directPhone != null) dm.setDirectPhone(req.directPhone);
        if (req.linkedinUrl != null) dm.setLinkedinUrl(req.linkedinUrl);
        return new DecisionMakerDTO(decisionMakerRepository.save(dm));
    }

    // Deletes a decision maker — validates it belongs to the given lead first
    @DeleteMapping("/{leadId}/decision-makers/{dmId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDecisionMaker(@PathVariable Long leadId,
                                    @PathVariable Long dmId) {
        DecisionMaker dm = decisionMakerRepository.findById(dmId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!dm.getLead().getId().equals(leadId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Decision maker does not belong to this lead");
        decisionMakerRepository.delete(dm);
    }
}