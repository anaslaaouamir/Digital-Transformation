package com.stage.leadintelligencesystem.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Data
@Getter
@Setter
public class IncomingReplyDto {
    private String email;
    private LocalDateTime repliedAt; // n8n sends the date
    private String emailBody;        // The content of the reply
    private String subject;
}