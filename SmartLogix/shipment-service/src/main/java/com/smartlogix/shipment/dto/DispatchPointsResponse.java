package com.smartlogix.shipment.dto;

import java.time.OffsetDateTime;

public record DispatchPointsResponse(
        String email,
        int puntosDespacho,
        int totalDespachos,
        OffsetDateTime updatedAt
) {
}
