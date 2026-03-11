package com.stage.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class GateWayConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowCredentials(true);
        corsConfig.setAllowedOriginPatterns(Arrays.asList("*"));
        corsConfig.setAllowedHeaders(Arrays.asList("*"));
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        return new CorsWebFilter(source);
    }

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                // Lead Intelligence System routes
                .route("lead-intelligence-lead_agent", r -> r
                        .path("/api/lead_agent/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-claude", r -> r
                        .path("/api/claude/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-interactions", r -> r
                        .path("/api/interactions/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-leads", r -> r
                        .path("/api/leads/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-sequences", r -> r
                        .path("/api/sequences/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-tracking", r -> r
                        .path("/api/tracking/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-webhooks", r -> r
                        .path("/api/webhooks/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-whatsapp", r -> r
                        .path("/api/whatsapp/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-scan", r -> r
                        .path("/api/scan/**")
                        .uri("lb://Lead-Intelligence-System"))
                .route("lead-intelligence-actions", r -> r
                        .path("/api/actions/**")
                        .uri("lb://Lead-Intelligence-System"))
                .build();
    }
}
