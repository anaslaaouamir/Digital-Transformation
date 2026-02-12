package com.stage.admin.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.stage.admin.entities.Employe;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {
}

