package com.stage.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;

@Configuration
public class GateWayConfig {

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("lead-intelligence-system", r -> r
                        .path("/api/lead_agent/**")
                        .uri("lb://Lead-Intelligence-System"))
                .build();
    }
}