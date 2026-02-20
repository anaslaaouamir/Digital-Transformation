package com.stage.leadintelligencesystem.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScanRequest {
    private String city;
    private String category; // React sends "restaurant, transport"
    private Integer max_results;
}
