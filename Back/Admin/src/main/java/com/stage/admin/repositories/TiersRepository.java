package com.stage.admin.repositories;

import com.stage.admin.entities.Tiers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TiersRepository extends JpaRepository<Tiers, Long> {

    // Rule: Check uniqueness of name
    boolean existsByNom(String nom);

    // Rule: Need Max ID to generate the next Code Client [cite: 60-61]
    @Query("SELECT MAX(t.id) FROM Tiers t")
    Long getMaxId();
}