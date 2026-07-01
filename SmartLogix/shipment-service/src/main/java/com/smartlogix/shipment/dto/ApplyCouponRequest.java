package com.smartlogix.shipment.dto;

/** Aplica el cupon disponible de un correo. Si se entrega trackingCode, se fija
 *  a ese envio exacto; si no, al mas reciente no entregado del correo. */
public record ApplyCouponRequest(
        String trackingCode
) {
}
