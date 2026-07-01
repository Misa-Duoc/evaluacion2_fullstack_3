package com.smartlogix.shipment.config;

import com.smartlogix.shipment.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/info").permitAll()

                        // --- Cupones de descuento ---
                        // Cualquier usuario autenticado (USER o ADMIN) puede consultar el
                        // catalogo, ver su propio estado de cupon e INGRESAR (registrar) un cupon.
                        .requestMatchers(HttpMethod.GET, "/api/shipments/coupons/catalog").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/shipments/coupons").authenticated()
                        // Solo ADMIN: listar todos los cupones, ACEPTAR (aplicar) y quitar.
                        .requestMatchers(HttpMethod.GET, "/api/shipments/coupons").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/shipments/coupons/*/apply").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/shipments/coupons/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/shipments/coupons/*").authenticated()

                        // --- Canje de puntos: solo ADMIN ---
                        .requestMatchers("/api/shipments/points/**").hasRole("ADMIN")

                        // --- Envios ---
                        // Ver envios: cualquier usuario autenticado.
                        .requestMatchers(HttpMethod.GET, "/api/shipments", "/api/shipments/*").authenticated()
                        // Crear envio (llamada interna del order-service) y cambiar estado: solo ADMIN.
                        .requestMatchers(HttpMethod.POST, "/api/shipments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/shipments/*/status").hasRole("ADMIN")

                        // Cualquier otra ruta /api requiere rol ADMIN.
                        .requestMatchers("/api/**").hasRole("ADMIN")
                        .anyRequest().denyAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
