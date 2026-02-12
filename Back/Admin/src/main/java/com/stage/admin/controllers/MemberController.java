package com.stage.admin.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stage.admin.entities.Employe;
import com.stage.admin.entities.Tiers;
import com.stage.admin.services.MemberService;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
public class MemberController {

    @Autowired
    private MemberService memberService;

    @PostMapping("/staff")
    public Employe createStaff(@RequestBody Employe employe) {
        return memberService.addStaff(employe);
    }

    @PostMapping("/client")
    public Tiers createClient(@RequestBody Tiers tiers) {
        return memberService.addClient(tiers);
    }

    @GetMapping("/staff")
    public List<Employe> getAllStaff() {
        return memberService.getAllStaff();
    }

    @GetMapping("/staff/{id}")
    public Optional<Employe> getStaff(@PathVariable Long id) {
        return memberService.getStaffById(id);
    }

    @DeleteMapping("/staff/{id}")
    public void deleteStaff(@PathVariable Long id) {
        memberService.deleteStaff(id);
    }

    @PutMapping("/staff/{id}")
    public Employe updateStaff(@PathVariable Long id, @RequestBody Employe e) {
        return memberService.updateStaff(id, e);
    }

    @GetMapping("/client")
    public List<Employe> getAll() {
        return memberService.getAllClient();
    }

    @GetMapping("/client/{id}")
    public Optional<Employe> getClient(@PathVariable Long id) {
        return memberService.getClientById(id);
    }

    @DeleteMapping("/client/{id}")
    public void deleteClient(@PathVariable Long id) {
        memberService.deleteClient(id);
    }

    @PutMapping("/client/{id}")
    public Employe updateClient(@PathVariable Long id, @RequestBody Employe e) {
        return memberService.updateClient(id, e);
    }





}

