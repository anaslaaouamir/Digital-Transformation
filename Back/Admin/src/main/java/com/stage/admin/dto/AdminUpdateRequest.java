package com.stage.admin.dto;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor

@Data
public class AdminUpdateRequest {
    private String nom;
    private String prenom;
    private String email;
    private String telephone;

    // Mandatory: User must provide this to confirm identity
    private String currentPassword;

    // Optional: Only provide if they want to change it
    private String newPassword;
}
