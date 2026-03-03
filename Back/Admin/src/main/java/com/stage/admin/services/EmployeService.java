package com.stage.admin.services;

import com.stage.admin.dto.EmployeResponse;
import com.stage.admin.entities.Employe;
import com.stage.admin.exceptions.DuplicateResourceException;
import com.stage.admin.exceptions.ResourceNotFoundException;
import com.stage.admin.repositories.EmployeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeService {

    private final EmployeRepository employeRepository;


    public EmployeService(EmployeRepository employeRepository) {
        this.employeRepository = employeRepository;

    }

    public EmployeResponse getById(Long id) {
        Employe e = employeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employe not found"));

        return mapToResponse(e);
    }

    public List<EmployeResponse> getAll() {
        List<Employe> employes = employeRepository.findAll();

        return employes.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void deleteById(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new RuntimeException("NOT_FOUND");
        }
        employeRepository.deleteById(id);
    }

    //  POST: Add employee
    public EmployeResponse create(Employe employe) {

        if (employeRepository.findByEmail(employe.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Email already exists");
        }

        return mapToResponse(employeRepository.save(employe));
    }

    // PUT: Update employee (Business data only)
    public EmployeResponse update(Long id, Employe data) {

        Employe existing = employeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employe not found"));

        existing.setNom(data.getNom());
        existing.setPrenom(data.getPrenom());
        existing.setTelephone(data.getTelephone());


        return mapToResponse(employeRepository.save(existing));
    }

    public void delete(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employe not found");
        }
        employeRepository.deleteById(id);
    }


    private EmployeResponse mapToResponse(Employe e) {
        return new EmployeResponse(
                e.getId(),
                e.getNom(),
                e.getPrenom(),
                e.getTelephone(),
                e.getEmail(),
                e.getCreatedAt()
        );
    }
}
