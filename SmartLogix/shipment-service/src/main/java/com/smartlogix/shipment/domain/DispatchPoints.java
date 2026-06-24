package com.smartlogix.shipment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/**
 * Representa el acumulado de "puntosDespacho" de un correo electronico.
 *
 * Regla de negocio:
 *  - La primera vez que un correo realiza un despacho, el registro se crea con puntosDespacho = 0.
 *  - Cada vez que ese mismo correo vuelve a realizar un despacho, puntosDespacho se incrementa en +5.
 */
@Entity
@Table(name = "dispatch_points")
public class DispatchPoints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false)
    private int puntosDespacho;

    @Column(nullable = false)
    private int totalDespachos;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void beforeInsert() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void beforeUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getPuntosDespacho() {
        return puntosDespacho;
    }

    public void setPuntosDespacho(int puntosDespacho) {
        this.puntosDespacho = puntosDespacho;
    }

    public int getTotalDespachos() {
        return totalDespachos;
    }

    public void setTotalDespachos(int totalDespachos) {
        this.totalDespachos = totalDespachos;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
