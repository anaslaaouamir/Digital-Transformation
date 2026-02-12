package com.stage.admin.services;

import com.stage.admin.entities.Tiers;
import com.stage.admin.repositories.TiersRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TiersService {

    private final TiersRepository tiersRepository;

    public TiersService(TiersRepository tiersRepository) {
        this.tiersRepository = tiersRepository;
    }

    //  Afficher la liste
    public List<Tiers> getAll() {
        return tiersRepository.findAll();
    }

    //  Afficher un seul (Détails)
    public Tiers getById(Long id) {
        return tiersRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
    }

    //  Ajouter un Tiers
    public Tiers create(Tiers tiers) {
        // Règle 1: Unicité (Check if name exists)
        if (tiersRepository.existsByNom(tiers.getNom())) {
            throw new RuntimeException("NAME_EXISTS");
        }

        // STEP 1: Save first to let Database generate the ID
        Tiers savedTiers = tiersRepository.save(tiers);

        // STEP 2: Generate Codes based on the real ID
        boolean needsUpdate = false;
        Long id = savedTiers.getId();

        // Logic A: Is it a Client? -> Generate CL-Code
        if (Boolean.TRUE.equals(savedTiers.getEstClient())) {
            savedTiers.setCodeClient("CL-" + id); // Example: CL-10
            needsUpdate = true;
        }
        // Logic B: Is it a Prospect (and NOT a client yet)? -> Generate PR-Code
        else if (Boolean.TRUE.equals(savedTiers.getEstProspect())) {
            savedTiers.setCodeClient("PR-" + id); // Example: PR-10
            needsUpdate = true;
        }

        // Logic C: Is it a Supplier? -> Generate FR-Code
        // Note: A Tiers can be BOTH Client and Supplier. This uses a separate column.
        if (Boolean.TRUE.equals(savedTiers.getEstFournisseur())) {
            savedTiers.setCodeFournisseur("FR-" + id); // Example: FR-10
            needsUpdate = true;
        }

        // STEP 3: Update the entry if codes were generated
        if (needsUpdate) {
            return tiersRepository.save(savedTiers);
        }

        return savedTiers;
    }

    //  Modifier un Tiers
    public Tiers update(Long id, Tiers updatedTiers) {
        Tiers existing = getById(id);

        // Update simple fields
        existing.setNom(updatedTiers.getNom());
        existing.setAdresse(updatedTiers.getAdresse());
        existing.setVille(updatedTiers.getVille());
        existing.setPays(updatedTiers.getPays());
        existing.setTelephone(updatedTiers.getTelephone());
        existing.setEmail(updatedTiers.getEmail());
        existing.setIce(updatedTiers.getIce());
        existing.setRc(updatedTiers.getRc());

        // Update checkboxes
        existing.setEstClient(updatedTiers.getEstClient());
        existing.setEstProspect(updatedTiers.getEstProspect());
        existing.setEstFournisseur(updatedTiers.getEstFournisseur());

        // Règle: If they switch from Prospect to Client, update the code
        if (Boolean.TRUE.equals(existing.getEstClient()) &&
                (existing.getCodeClient() == null || existing.getCodeClient().startsWith("PR-"))) {
            existing.setCodeClient("CL-" + existing.getId());
        }

        // Règle: If they become Supplier and didn't have a code
        if (Boolean.TRUE.equals(existing.getEstFournisseur()) && existing.getCodeFournisseur() == null) {
            existing.setCodeFournisseur("FR-" + existing.getId());
        }


        // Update Commercial Assigned
        existing.setCommercialAssigne(updatedTiers.getCommercialAssigne());

        // NOTE: We do NOT update codeClient [cite: 74]

        return tiersRepository.save(existing);
    }

    //  Supprimer
    public void delete(Long id) {
        if (!tiersRepository.existsById(id)) {
            throw new RuntimeException("NOT_FOUND");
        }
        tiersRepository.deleteById(id);
    }
}