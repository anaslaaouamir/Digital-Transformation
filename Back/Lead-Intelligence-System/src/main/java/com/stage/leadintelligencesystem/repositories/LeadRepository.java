package com.stage.leadintelligencesystem.repositories;

import com.stage.leadintelligencesystem.entities.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    Optional<Lead> findByGoogleMapsUrl(String googleMapsUrl);
    List<Lead> findByTemperatureAndContactStatusAndEmailIsNotNull(String temperature, String contactStatus);

}
