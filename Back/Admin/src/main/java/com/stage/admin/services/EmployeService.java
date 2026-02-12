package com.stage.admin.services;

import com.stage.admin.entities.Employe;
import com.stage.admin.repositories.EmployeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeService {

    private final EmployeRepository employeRepository;

    public EmployeService(EmployeRepository employeRepository) {
        this.employeRepository = employeRepository;
    }

    public List<Employe> getAll(String role) {
        if (role != null && !role.isBlank()) {
            return employeRepository.findByRole(role);
        }
        return employeRepository.findAll();
    }

    public void deleteById(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new RuntimeException("Employe not found");
        }
        employeRepository.deleteById(id);
    }
}
