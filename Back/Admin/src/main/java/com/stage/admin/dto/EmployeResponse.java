package com.stage.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String telephone;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}
