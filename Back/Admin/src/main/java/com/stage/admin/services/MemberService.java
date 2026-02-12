package com.stage.admin.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stage.admin.entities.Employe;
import com.stage.admin.entities.Tiers;
import com.stage.admin.repositories.EmployeRepository;
import com.stage.admin.repositories.TiersRepository;

@Service
public class MemberService {

    @Autowired
    private EmployeRepository employeRepository;

    @Autowired
    private TiersRepository tiersRepository;

    public Employe addStaff(Employe employe) {
        return employeRepository.save(employe);
    }

    public Tiers addClient(Tiers tiers) {
        tiers.setEstClient(true);
        return tiersRepository.save(tiers);
    }

    public List<Employe> getAllClient() {
        return employeRepository.findAll();
    }
    
    public Optional<Employe> getClientById(Long id) {
        return employeRepository.findById(id);
    }   

    public void deleteClient(Long id) {
        employeRepository.deleteById(id);
    }

    public Employe updateClient(Long id, Employe e) {
        Employe existing = employeRepository.findById(id).orElseThrow();
        existing.setNom(e.getNom());
        existing.setPrenom(e.getPrenom());
        existing.setTelephone(e.getTelephone());
        existing.setEmail(e.getEmail());
        existing.setRole(e.getRole());
            return employeRepository.save(existing);
    }

        public List<Employe> getAllStaff() {
        return employeRepository.findAll();
    }
    
    public Optional<Employe> getStaffById(Long id) {
        return employeRepository.findById(id);
    }   

    public void deleteStaff(Long id) {
        employeRepository.deleteById(id);
    }

    public Employe updateStaff(Long id, Employe e) {
        Employe existing = employeRepository.findById(id).orElseThrow();
        existing.setNom(e.getNom());
        existing.setPrenom(e.getPrenom());
        existing.setTelephone(e.getTelephone());
        existing.setEmail(e.getEmail());
        existing.setRole(e.getRole());
            return employeRepository.save(existing);
    }


}
