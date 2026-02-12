package com.stage.admin.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.stage.admin.entities.Tiers;

@Repository
public interface TiersRepository extends JpaRepository<Tiers, Long> {
}
