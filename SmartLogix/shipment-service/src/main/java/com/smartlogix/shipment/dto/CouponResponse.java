package com.smartlogix.shipment.dto;

/** Cupon asociado a un correo, tal como se lista en la pagina "Descuento". */
public record CouponResponse(
        String email,
        String coupon,
        String descripcion,
        String status,
        String trackingCode
) {
}
