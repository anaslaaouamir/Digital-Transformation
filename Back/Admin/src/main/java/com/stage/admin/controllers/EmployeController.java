package com.stage.admin.controllers;

import com.stage.admin.dto.EmployeResponse;
import com.stage.admin.entities.Employe;
import com.stage.admin.services.EmployeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employes")
public class EmployeController {

    private final EmployeService employeService;

    public EmployeController(EmployeService employeService) {
        this.employeService = employeService;
    }

    // We dont need to Convert Employe to EmployeResponse (without password)
    // Because the only one who will loged in is admin , and also we separate the logic of
    // autentification and role ... is now on the separate service (keycloak)

    @GetMapping("/{id}")
    public EmployeResponse getById(@PathVariable Long id) {
        return employeService.getById(id);
    }

    @GetMapping
    public List<EmployeResponse> getAll() {
        return employeService.getAll();
    }

    @PostMapping
    public EmployeResponse create(@Valid @RequestBody Employe employe) {
        return employeService.create(employe);
    }

    @PutMapping("/{id}")
    public EmployeResponse update(@PathVariable Long id,
                                  @Valid @RequestBody Employe employe) {
        return employeService.update(id, employe);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        employeService.delete(id);
    }

}
