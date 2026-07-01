package com.smartlogix.shipment.domain;

/**
 * Estados del ciclo de vida de un cupon de descuento de envio asociado a un correo.
 *
 *  - AVAILABLE: el correo tiene el cupon asociado pero todavia NO se aplico a
 *               ningun envio. El envio mantiene su valor normal.
 *  - APPLIED:   el cupon ya se fijo a un envio concreto (trackingCode). El cupon
 *               es unico por correo, asi que en este estado no puede reutilizarse.
 */
public enum CouponStatus {
    AVAILABLE,
    APPLIED
}
