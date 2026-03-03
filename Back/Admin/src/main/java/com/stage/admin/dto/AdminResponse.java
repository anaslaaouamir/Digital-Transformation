package com.stage.admin.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class AdminResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String telephone;
    private String email;
    private LocalDateTime createdAt;
}
