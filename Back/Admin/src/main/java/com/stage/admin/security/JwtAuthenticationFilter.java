package com.stage.admin.security;

import com.stage.admin.entities.Admin;
import com.stage.admin.repositories.AdminRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final AdminRepository adminRepository;

    public JwtAuthenticationFilter(JwtProvider jwtProvider, AdminRepository adminRepository) {
        this.jwtProvider = jwtProvider;
        this.adminRepository = adminRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String jwt = resolveToken(request);

        try {
            if (StringUtils.hasText(jwt)
                    && jwtProvider.validateToken(jwt)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                Long adminId = jwtProvider.getAdminIdFromToken(jwt);
                Optional<Admin> adminOpt = adminRepository.findById(adminId);

                if (adminOpt.isPresent()) {
                    Admin admin = adminOpt.get();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    admin,
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}