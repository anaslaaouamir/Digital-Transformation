package com.stage.leadintelligencesystem.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SimulatedEmailDto {
    private Long leadId;
    private String email;
    private String subject;
    private String body;
}
