package com.smartlogix.shipment.dto;

/**
 * Resultado de aplicar un cupon:
 *  - status: "applied" | "already_used" | "none"
 */
public record ApplyCouponResponse(
        String status,
        String coupon,
        String appliedTrackingCode,
        Integer valorEnvioFinal,
        String mensaje
) {
}
