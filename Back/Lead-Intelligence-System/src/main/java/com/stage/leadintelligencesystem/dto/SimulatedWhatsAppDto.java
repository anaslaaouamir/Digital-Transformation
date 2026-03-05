package com.stage.leadintelligencesystem.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SimulatedWhatsAppDto {
    private Long leadId;
    private String phoneNumber;
    private String body;


}