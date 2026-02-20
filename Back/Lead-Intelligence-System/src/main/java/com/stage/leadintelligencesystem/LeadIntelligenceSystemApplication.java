package com.stage.leadintelligencesystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class LeadIntelligenceSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(LeadIntelligenceSystemApplication.class, args);
    }

}
