package com.stage.leadintelligencesystem.repositories;

import com.stage.leadintelligencesystem.entities.Secteur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SecteurRepository extends JpaRepository<Secteur, Long> {
    Optional<Secteur> findByName(String name);
}
