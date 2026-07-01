package com.smartlogix.shipment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String trackingCode;

    @Column(nullable = false, length = 60)
    private String orderNumber;

    @Column(nullable = false, length = 120)
    private String customerEmail;

    @Column(nullable = false, length = 255)
    private String destinationAddress;

    @Column(nullable = false)
    private int totalUnits;

    @Column(nullable = false, length = 40)
    private String carrier;

    @Column(nullable = false, length = 40)
    private String routeCode;

    @Column(nullable = false)
    private LocalDate estimatedDeliveryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShipmentStatus status;

    // Valor base del envio (en CLP). Antes se calculaba en el frontend a partir
    // de un hash del trackingCode; ahora se genera y persiste en el backend para
    // que sea estable y no manipulable desde el cliente.
    @Column(nullable = false)
    private int baseValue;

    // Valor final del envio una vez aplicado un eventual descuento (por puntos)
    // o cupon (por codigo). Si no hay descuento, es igual a baseValue.
    @Column(nullable = false)
    private int finalValue;

    // Codigo del cupon aplicado a ESTE envio (ALUMNODUOC, ENVIOGRATIS, FREECODE),
    // si corresponde. El cupon deja el envio en un valor fijo.
    @Column(length = 40)
    private String appliedCouponCode;

    // Descuento por puntos aplicado a ESTE envio (DESCUENTO_20, DESCUENTO_50,
    // ENVIO_GRATIS), si corresponde. Se traduce en un porcentaje sobre baseValue.
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RewardType appliedRewardType;

    // Texto descriptivo del descuento/cupon aplicado, para mostrar en la UI.
    @Column(length = 120)
    private String discountDescription;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void beforeInsert() {
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTrackingCode() {
        return trackingCode;
    }

    public void setTrackingCode(String trackingCode) {
        this.trackingCode = trackingCode;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getDestinationAddress() {
        return destinationAddress;
    }

    public void setDestinationAddress(String destinationAddress) {
        this.destinationAddress = destinationAddress;
    }

    public int getTotalUnits() {
        return totalUnits;
    }

    public void setTotalUnits(int totalUnits) {
        this.totalUnits = totalUnits;
    }

    public String getCarrier() {
        return carrier;
    }

    public void setCarrier(String carrier) {
        this.carrier = carrier;
    }

    public String getRouteCode() {
        return routeCode;
    }

    public void setRouteCode(String routeCode) {
        this.routeCode = routeCode;
    }

    public LocalDate getEstimatedDeliveryDate() {
        return estimatedDeliveryDate;
    }

    public void setEstimatedDeliveryDate(LocalDate estimatedDeliveryDate) {
        this.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    public ShipmentStatus getStatus() {
        return status;
    }

    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }

    public int getBaseValue() {
        return baseValue;
    }

    public void setBaseValue(int baseValue) {
        this.baseValue = baseValue;
    }

    public int getFinalValue() {
        return finalValue;
    }

    public void setFinalValue(int finalValue) {
        this.finalValue = finalValue;
    }

    public String getAppliedCouponCode() {
        return appliedCouponCode;
    }

    public void setAppliedCouponCode(String appliedCouponCode) {
        this.appliedCouponCode = appliedCouponCode;
    }

    public RewardType getAppliedRewardType() {
        return appliedRewardType;
    }

    public void setAppliedRewardType(RewardType appliedRewardType) {
        this.appliedRewardType = appliedRewardType;
    }

    public String getDiscountDescription() {
        return discountDescription;
    }

    public void setDiscountDescription(String discountDescription) {
        this.discountDescription = discountDescription;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
