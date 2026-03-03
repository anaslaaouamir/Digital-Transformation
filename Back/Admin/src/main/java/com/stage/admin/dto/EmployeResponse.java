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
    //private String role; we dont need actually this , because we know alrady that he is an employer (== role)
    // AND Management of roles and user now are separated on his own service with keacloak
    private LocalDateTime createdAt;
}
