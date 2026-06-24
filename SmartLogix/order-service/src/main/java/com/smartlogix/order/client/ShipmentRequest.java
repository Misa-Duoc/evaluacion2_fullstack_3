package com.smartlogix.order.client;

public record ShipmentRequest(
        String orderNumber,
        String customerEmail,
        String destinationAddress,
        int totalUnits
) {
}
