package com.smartlogix.shipment.dto;

import java.util.List;

/** Codigos de cupon validos y valor fijo de envio. Reemplaza las constantes
 *  VALID_COUPONS / COUPON_SHIPMENT_VALUE que vivian en el frontend. */
public record CouponCatalogResponse(
        List<String> validCoupons,
        int shipmentValue
) {
}
