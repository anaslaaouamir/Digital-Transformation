package com.stage.leadintelligencesystem.services;

import com.stage.leadintelligencesystem.dto.ScanRequest;
import com.stage.leadintelligencesystem.entities.Lead;
import com.stage.leadintelligencesystem.entities.Secteur;
import org.springframework.beans.factory.annotation.Value;
import com.stage.leadintelligencesystem.repositories.LeadRepository;
import com.stage.leadintelligencesystem.repositories.SecteurRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class ScanService {

    private final RestTemplate restTemplate;
    private final LeadRepository leadRepository;
    private final SecteurRepository secteurRepository;
    @Value("${leads.generator.base-url:http://localhost:5000}")
    private String leadsGeneratorBaseUrl;

    public ScanService(RestTemplate restTemplate, LeadRepository leadRepository, SecteurRepository secteurRepository) {
        this.restTemplate = restTemplate;
        this.leadRepository = leadRepository;
        this.secteurRepository = secteurRepository;
    }

    // 1. Initiate the scan
    public String initiateScan(ScanRequest request) {
        
        String flaskStartUrl = leadsGeneratorBaseUrl + "/api/start";

        Map<String, Object> payload = Map.of(
                "city", request.getCity(),
                "category", request.getCategory(),
                "max_results", request.getMax_results() != null ? request.getMax_results() : 20
        );

        Map<String, String> response = restTemplate.postForObject(flaskStartUrl, payload, Map.class);
        String jobId = response.get("job_id");

        // Kick off background processing
        pollAndSaveLeads(jobId, request.getCategory());

        return jobId;
    }

    // 2. Poll in the background
    @Async
    public void pollAndSaveLeads(String jobId, String searchedCategory) {
        String statusUrl = leadsGeneratorBaseUrl + "/api/status/" + jobId;
        boolean isDone = false;

        while (!isDone) {
            try {
                Thread.sleep(3000); // Check every 3 seconds

                Map<String, Object> statusResponse = restTemplate.getForObject(statusUrl, Map.class);
                String status = (String) statusResponse.get("status");

                if ("done".equals(status)) {
                    isDone = true;
                    List<Map<String, Object>> leadsData = (List<Map<String, Object>>) statusResponse.get("leads");

                    // Ensure the Sector exists
                    Secteur secteur = secteurRepository.findByName(searchedCategory)
                            .orElseGet(() -> {
                                Secteur newSecteur = new Secteur();
                                newSecteur.setName(searchedCategory);
                                return secteurRepository.save(newSecteur);
                            });

                    // Save all leads
                    for (Map<String, Object> leadData : leadsData) {
                        upsertLead(leadData, secteur);
                    }
                }
            } catch (Exception e) {
                System.err.println("Polling error: " + e.getMessage());
                break; // Stop looping on critical error
            }
        }
    }

    // 3. Upsert Logic (Insert or Update)
    private void upsertLead(Map<String, Object> leadData, Secteur secteur) {
        String mapsUrl = (String) leadData.get("google_maps_url");
        if (mapsUrl == null || mapsUrl.isEmpty()) return;

        Lead lead = leadRepository.findByGoogleMapsUrl(mapsUrl).orElse(new Lead());

        // Map String fields
        lead.setGoogleMapsUrl(mapsUrl);
        lead.setCompanyName((String) leadData.get("name"));
        lead.setAddress((String) leadData.get("address"));
        lead.setCity((String) leadData.get("city"));
        lead.setPhoneNumber((String) leadData.get("phone"));
        lead.setWebsite((String) leadData.get("website"));
        lead.setGoogleTypes((String) leadData.get("types"));
        lead.setTemperature((String) leadData.get("temperature"));
        lead.setSecteur(secteur);

        // Handle number fields safely
        Object ratingObj = leadData.get("rating");
        if (ratingObj instanceof Number) lead.setGoogleRating(((Number) ratingObj).doubleValue());

        Object reviewsObj = leadData.get("reviews");
        if (reviewsObj instanceof Number) lead.setGoogleReviews(((Number) reviewsObj).intValue());

        Object scoreObj = leadData.get("score");
        if (scoreObj instanceof Number) lead.setAiScore(((Number) scoreObj).intValue());

        // THE FIX: Safely parse price_level whether it arrives as an Integer or an empty String
        Object priceObj = leadData.get("price_level");
        if (priceObj != null && !priceObj.toString().isEmpty()) {
            lead.setPriceLevel(priceObj.toString());
        }

        leadRepository.save(lead);
    }

    public Map<String, Object> getStatus(String jobId) {
        String statusUrl = leadsGeneratorBaseUrl + "/api/status/" + jobId;
        return restTemplate.getForObject(statusUrl, Map.class);
    }
}
