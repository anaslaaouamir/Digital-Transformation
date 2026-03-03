package com.stage.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor

@Data
public class AdminUpdateRequest {
    @Size(max = 100, message = "FIRST_NAME_TOO_LONG")
    private String nom;

    @Size(max = 100, message = "LAST_NAME_TOO_LONG")
    private String prenom;

    @Size(max = 20, message = "INVALID_PHONE")
    private String telephone;

    @Email(message = "INVALID_EMAIL")
    private String email;

}
