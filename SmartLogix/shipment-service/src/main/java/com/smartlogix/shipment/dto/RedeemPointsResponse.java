package com.smartlogix.shipment.dto;

public record RedeemPointsResponse(
        String email,
        String rewardType,
        String descripcion,
        int puntosUsados,
        int puntosRestantes,
        String mensaje,
        String appliedTrackingCode,
        Integer valorEnvioFinal
) {
}
