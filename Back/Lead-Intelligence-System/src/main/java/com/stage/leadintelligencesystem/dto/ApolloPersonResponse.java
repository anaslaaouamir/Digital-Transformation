package com.stage.leadintelligencesystem.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApolloPersonResponse {

    @JsonProperty("person")
    private Person person;

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Person {

        @JsonProperty("name")
        private String name;

        @JsonProperty("title")
        private String title;

        @JsonProperty("email")
        private String email;

        @JsonProperty("linkedin_url")
        private String linkedinUrl;

        @JsonProperty("phone_numbers")
        private List<PhoneNumber> phoneNumbers;
    }

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PhoneNumber {

        @JsonProperty("sanitized_number")
        private String sanitizedNumber;
    }
}