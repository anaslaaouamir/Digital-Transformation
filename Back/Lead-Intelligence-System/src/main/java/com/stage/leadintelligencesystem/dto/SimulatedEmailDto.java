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
    private String attachmentUrls;

    public SimulatedEmailDto(Long leadId, String email, String subject, String body) {
        this.leadId = leadId;
        this.email = email;
        this.subject = subject;
        this.body = body;
    }
}
