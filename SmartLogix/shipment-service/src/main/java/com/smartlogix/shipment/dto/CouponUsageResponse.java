package com.smartlogix.shipment.dto;

/**
 * Estado de uso del cupon de un correo, usado por la pagina "Ordenes":
 *  - state: "none" | "available" | "used"
 *  - coupon/descripcion: datos del cupon si existe.
 */
public record CouponUsageResponse(
        String email,
        String state,
        String coupon,
        String descripcion
) {
}
