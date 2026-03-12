package com.stage.leadintelligencesystem.services;

import com.stage.leadintelligencesystem.dto.ApolloOrganizationResponse;
import com.stage.leadintelligencesystem.dto.ApolloPersonResponse;
import com.stage.leadintelligencesystem.entities.DecisionMaker;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.repositories.DecisionMakerRepository;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApolloEnrichmentService {

    private final LeadRepository leadRepository;
    private final DecisionMakerRepository decisionMakerRepository;
    private final RestTemplate restTemplate;

    @Value("${apollo.base-url}")
    private String apolloBaseUrl;

    @Value("${apollo.api-key:mock-key}")
    private String apolloApiKey;

    // Enrich one lead by id
    public Lead enrichLead(Long leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + leadId));

        String domain = extractDomain(lead.getWebsite());

        // Step 1 — org enrichment → fill Lead fields
        try {
            ApolloOrganizationResponse orgResponse = fetchOrganizationEnrichment(domain, lead.getCompanyName());
            mapOrganizationToLead(orgResponse, lead);
        } catch (Exception e) {
            log.warn("Org enrichment failed for lead {}: {}", leadId, e.getMessage());
        }

        // Step 2 — people match → create DecisionMaker
        try {
            ApolloPersonResponse personResponse = fetchPersonMatch(domain, lead.getCompanyName());
            // FIX 1: check person is not null before mapping
            if (personResponse != null && personResponse.getPerson() != null) {
                DecisionMaker dm = mapPersonToDecisionMaker(personResponse, lead);
                // FIX 2: only save if fullName is present (it's non-nullable in DB)
                if (!isBlank(dm.getFullName())) {
                    decisionMakerRepository.save(dm);
                    lead.getDecisionMakers().add(dm);
                } else {
                    log.warn("Skipping DecisionMaker for lead {} — no name returned", leadId);
                }
            } else {
                log.warn("No person found by Apollo for lead {}", leadId);
            }
        } catch (Exception e) {
            log.warn("People match failed for lead {}: {}", leadId, e.getMessage());
        }

        lead.setIsEnriched(true);
        return leadRepository.save(lead);
    }

    // Enrich all leads not yet enriched
    public void enrichAllPending() {
        List<Lead> pending = leadRepository.findByIsEnrichedFalse();
        log.info("Enriching {} pending leads...", pending.size());
        for (Lead lead : pending) {
            try {
                enrichLead(lead.getId());
            } catch (Exception e) {
                log.error("Failed to enrich lead {}: {}", lead.getId(), e.getMessage());
            }
        }
    }

    // GET {base-url}/organizations/enrich?domain=x&name=y
    private ApolloOrganizationResponse fetchOrganizationEnrichment(String domain, String name) {
        // FIX 3: api_key removed from URL — key is already sent in header via buildRequest
        String url = apolloBaseUrl + "/organizations/enrich?domain=" + domain + "&name=" + encode(name);
        log.info("Calling Apollo org enrichment: {}", url);
        ResponseEntity<ApolloOrganizationResponse> response =
                restTemplate.exchange(url, HttpMethod.GET, buildRequest(null), ApolloOrganizationResponse.class);
        return response.getBody();
    }

    // POST {base-url}/people/match
    private ApolloPersonResponse fetchPersonMatch(String domain, String orgName) {
        // FIX 3: api_key removed from URL — key is already sent in header via buildRequest
        String url = apolloBaseUrl + "/people/match";
        Map<String, String> body = Map.of(
                "domain", domain,
                "organization_name", orgName,
                "reveal_personal_emails", "true",
                "reveal_phone_number", "true"
        );
        log.info("Calling Apollo people match for domain: {}", domain);
        ResponseEntity<ApolloPersonResponse> response =
                restTemplate.exchange(url, HttpMethod.POST, buildRequest(body), ApolloPersonResponse.class);
        return response.getBody();
    }

    // Apollo Organization → Lead (only fill missing fields)
    private void mapOrganizationToLead(ApolloOrganizationResponse response, Lead lead) {
        if (response == null || response.getOrganization() == null) return;

        ApolloOrganizationResponse.Organization org = response.getOrganization();

        if (isBlank(lead.getWebsite()) && org.getWebsiteUrl() != null)
            lead.setWebsite(org.getWebsiteUrl());

        if (isBlank(lead.getLinkedinUrl()) && org.getLinkedinUrl() != null)
            lead.setLinkedinUrl(org.getLinkedinUrl());

        if (isBlank(lead.getPhoneNumber()) && org.getSanitizedPhone() != null)
            lead.setPhoneNumber(org.getSanitizedPhone());

        if (isBlank(lead.getEmail()) || lead.getEmail().contains("@temp-lead.com")) {
            if (org.getContactEmails() != null && !org.getContactEmails().isEmpty()) {
                lead.setEmail(org.getContactEmails().get(0).getEmail());
            } else if (!isBlank(org.getPrimaryDomain())) {
                lead.setEmail("contact@" + org.getPrimaryDomain());
            }
        }

        if (isBlank(lead.getEmployeeCount()) && org.getEstimatedNumEmployees() != null)
            lead.setEmployeeCount(String.valueOf(org.getEstimatedNumEmployees()));

        if (isBlank(lead.getRevenueCapital()) && org.getAnnualRevenuePrinted() != null)
            lead.setRevenueCapital(org.getAnnualRevenuePrinted());
    }

    // Apollo Person → DecisionMaker
    private DecisionMaker mapPersonToDecisionMaker(ApolloPersonResponse response, Lead lead) {
        ApolloPersonResponse.Person person = response.getPerson();

        DecisionMaker dm = new DecisionMaker();
        dm.setLead(lead);
        dm.setFullName(person.getName());       // checked for null before saving
        dm.setTitle(person.getTitle());
        dm.setEmail(person.getEmail());
        dm.setLinkedinUrl(person.getLinkedinUrl());

        if (person.getPhoneNumbers() != null && !person.getPhoneNumbers().isEmpty()) {
            dm.setDirectPhone(person.getPhoneNumbers().get(0).getSanitizedNumber());
        }

        return dm;
    }

    private String extractDomain(String website) {
        if (website == null || website.isBlank()) return "temp-lead.com";
        return website
                .replaceAll("https?://(www\\.)?", "")
                .replaceAll("/.*", "")
                .trim();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String encode(String value) {
        if (value == null) return "";
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value;
        }
    }

    private HttpEntity<?> buildRequest(Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apolloApiKey);
        return new HttpEntity<>(body, headers);
    }
}