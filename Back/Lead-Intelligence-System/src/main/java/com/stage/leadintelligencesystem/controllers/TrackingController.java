package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.entities.Interaction;
import com.stage.leadintelligencesystem.repositories.InteractionRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final InteractionRepository interactionRepository;

    // Base64 string of a 1x1 transparent GIF
    private static final String TRANSPARENT_GIF_BASE64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    private final byte[] gifBytes = Base64.getDecoder().decode(TRANSPARENT_GIF_BASE64);

    public TrackingController(InteractionRepository interactionRepository) {
        this.interactionRepository = interactionRepository;
    }

    @GetMapping("/open/{interactionId}")
    public ResponseEntity<byte[]> trackOpen(@PathVariable Long interactionId, HttpServletRequest request) {

        String userAgent = request.getHeader("User-Agent");
        System.out.println("====== REQUÊTE REÇUE POUR : " + interactionId + " ======");
        System.out.println("User-Agent: " + userAgent);

        Optional<Interaction> optionalInteraction = interactionRepository.findById(interactionId);

        if (optionalInteraction.isPresent()) {
            Interaction interaction = optionalInteraction.get();
            LocalDateTime sentAt = interaction.getSentAt();
            LocalDateTime now = LocalDateTime.now();

            // Check if the open happened within 45 seconds of sending
            boolean isTooFast = false;
            if (sentAt != null) {
                long secondsSinceSent = java.time.Duration.between(sentAt, now).getSeconds();
                isTooFast = secondsSinceSent < 45; // Adjust this threshold as you see fit
            }

            if (isTooFast) {
                System.out.println("🛑 Bot détecté (Ouverture trop rapide : " + java.time.Duration.between(sentAt, now).getSeconds() + "s) ! Ignoré.");
            } else {
                System.out.println("✅ Vraie ouverture acceptée pour l'interaction : " + interactionId);

                if (interaction.getOpenedAt() == null) {
                    interaction.setOpenedAt(now);
                }

                if ("SENT".equals(interaction.getStatus())) {
                    interaction.setStatus("OPENED");
                }

                interactionRepository.save(interaction);
            }
        }

        // Return the invisible image
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_GIF);
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        headers.setPragma("no-cache");
        headers.setExpires(0L);

        return new ResponseEntity<>(gifBytes, headers, HttpStatus.OK);
    }
}