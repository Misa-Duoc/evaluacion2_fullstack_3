package com.smartlogix.shipment.dto;

import com.smartlogix.shipment.domain.RewardType;
import jakarta.validation.constraints.NotNull;

public record RedeemPointsRequest(
        @NotNull(message = "Debe indicar el tipo de descuento a canjear")
        RewardType rewardType
) {
}
