package com.smartlogix.shipment.dto;

import com.smartlogix.shipment.domain.RewardType;
import jakarta.validation.constraints.NotNull;

public record RedeemPointsRequest(
        @NotNull(message = "Debe indicar el tipo de descuento a canjear")
        RewardType rewardType,

        // Opcional: si se entrega, el descuento se fija a ESE envio exacto.
        // Si es null, el backend lo aplica al envio mas reciente no entregado
        // del correo (o al ultimo si todos estan entregados).
        String trackingCode
) {
}
