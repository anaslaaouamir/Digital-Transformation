package com.stage.admin.controllers;

import com.stage.admin.entities.Tiers;
import com.stage.admin.services.TiersService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tiers") // [cite: 53, 65] Correct Endpoint
@CrossOrigin("*")
public class TiersController {

    private final TiersService tiersService;

    public TiersController(TiersService tiersService) {
        this.tiersService = tiersService;
    }

    // 9. Afficher la liste des Tiers [cite: 64]
    @GetMapping
    public List<Tiers> getAllTiers() {
        return tiersService.getAll();
    }

    // 10. Afficher un seul Tiers [cite: 68]
    @GetMapping("/{id}")
    public ResponseEntity<?> getTiersById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tiersService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("{\"error\": \"Tiers not found\"}");
        }
    }

    // 8. Ajouter un Tiers [cite: 52]
    @PostMapping
    public ResponseEntity<?> createTiers(@RequestBody Tiers tiers) {
        try {
            Tiers saved = tiersService.create(tiers);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            if ("NAME_EXISTS".equals(e.getMessage())) {
                return ResponseEntity.status(400).body("{\"error\": \"Ce nom de société existe déjà\"}");
            }
            return ResponseEntity.status(400).body("{\"error\": \"Erreur lors de la création\"}");
        }
    }

    // 11. Modifier un Tiers [cite: 71]
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTiers(@PathVariable Long id, @RequestBody Tiers tiers) {
        try {
            Tiers updated = tiersService.update(id, tiers);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("{\"error\": \"Tiers not found\"}");
        }
    }

    // 12. Supprimer un Tiers [cite: 75]
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTiers(@PathVariable Long id) {
        try {
            tiersService.delete(id);
            return ResponseEntity.ok().body("{\"message\": \"Tiers supprimé\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("{\"error\": \"Tiers not found\"}");
        }
    }
}