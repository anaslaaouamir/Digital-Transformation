package com.stage.leadintelligencesystem.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApolloOrganizationResponse {

    @JsonProperty("organization")
    private Organization organization;

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Organization {

        @JsonProperty("website_url")
        private String websiteUrl;

        @JsonProperty("linkedin_url")
        private String linkedinUrl;

        @JsonProperty("sanitized_phone")
        private String sanitizedPhone;

        @JsonProperty("primary_domain")
        private String primaryDomain;

        @JsonProperty("annual_revenue_printed")
        private String annualRevenuePrinted;

        @JsonProperty("estimated_num_employees")
        private Integer estimatedNumEmployees;

        @JsonProperty("contact_emails")
        private List<ContactEmail> contactEmails;
    }

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ContactEmail {

        @JsonProperty("email")
        private String email;
    }
}
