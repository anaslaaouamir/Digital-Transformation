package com.stage.leadintelligencesystem.dto;

public class ClaudeGenerateDto {

    private String subject;   // email subject (null for WhatsApp-only)
    private String body;      // email body   (null for WhatsApp-only)
    private String waBody;    // WhatsApp msg  (null for email-only)

    public ClaudeGenerateDto() {}

    public ClaudeGenerateDto(String subject, String body, String waBody) {
        this.subject = subject;
        this.body    = body;
        this.waBody  = waBody;
    }

    // ── getters & setters ──

    public String getSubject()            { return subject; }
    public void   setSubject(String s)    { this.subject = s; }

    public String getBody()               { return body; }
    public void   setBody(String b)       { this.body = b; }

    public String getWaBody()             { return waBody; }
    public void   setWaBody(String w)     { this.waBody = w; }
}