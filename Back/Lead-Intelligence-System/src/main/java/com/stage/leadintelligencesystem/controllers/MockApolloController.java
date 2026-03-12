package com.stage.leadintelligencesystem.controllers;

import com.stage.leadintelligencesystem.dto.ApolloOrganizationResponse;
import com.stage.leadintelligencesystem.dto.ApolloPersonResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/mock/apollo")
public class MockApolloController {

    @GetMapping("/organizations/enrich")
    public ApolloOrganizationResponse enrichOrganization(
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String name) {

        String resolvedDomain = (domain != null && !domain.isBlank()) ? domain : "temp-lead.com";

        ApolloOrganizationResponse.ContactEmail contactEmail = new ApolloOrganizationResponse.ContactEmail();
        contactEmail.setEmail("contact@" + resolvedDomain);

        ApolloOrganizationResponse.Organization org = new ApolloOrganizationResponse.Organization();
        org.setWebsiteUrl("https://www." + resolvedDomain);
        org.setLinkedinUrl("https://www.linkedin.com/company/" + resolvedDomain);
        org.setSanitizedPhone("+212537000000");
        org.setPrimaryDomain(resolvedDomain);
        org.setAnnualRevenuePrinted("500K");
        org.setEstimatedNumEmployees(25);
        org.setContactEmails(List.of(contactEmail));

        ApolloOrganizationResponse response = new ApolloOrganizationResponse();
        response.setOrganization(org);
        return response;
    }

    @PostMapping("/people/match")
    public ApolloPersonResponse matchPerson(@RequestBody Map<String, String> body) {

        String domain = body.getOrDefault("domain", "company.com");

        ApolloPersonResponse.PhoneNumber phone = new ApolloPersonResponse.PhoneNumber();
        phone.setSanitizedNumber("+212661000000");

        ApolloPersonResponse.Person person = new ApolloPersonResponse.Person();
        person.setName("Mohammed El Mansouri");
        person.setTitle("Directeur Général");
        person.setEmail("m.elmansouri@" + domain);
        person.setLinkedinUrl("https://www.linkedin.com/in/mohammed-elmansouri");
        person.setPhoneNumbers(List.of(phone));

        ApolloPersonResponse response = new ApolloPersonResponse();
        response.setPerson(person);
        return response;
    }
}