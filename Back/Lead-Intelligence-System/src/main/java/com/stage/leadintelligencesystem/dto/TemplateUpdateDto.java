package com.stage.leadintelligencesystem.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class TemplateUpdateDto {
    private Long templateId;
    private String subject;
    private String body;
    private Integer delayDays; // null for mass email template (no step)
}
