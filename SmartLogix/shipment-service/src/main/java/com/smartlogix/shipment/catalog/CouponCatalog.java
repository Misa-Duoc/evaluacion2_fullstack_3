package com.smartlogix.shipment.catalog;

import java.util.List;
import java.util.Locale;

/**
 * Catalogo de cupones de descuento de envio por codigo.
 *
 * Centraliza las reglas que antes estaban hardcodeadas en el frontend
 * (couponStorage.js): la lista de codigos validos y el valor fijo de envio
 * que otorga cualquiera de ellos. Asi el frontend ya no necesita conocerlas.
 */
public final class CouponCatalog {

    // Valor fijo de envio (CLP) cuando el correo cuenta con un cupon aplicado.
    public static final int COUPON_SHIPMENT_VALUE = 1000;

    // Codigos de cupon validos. Todos dejan el envio en COUPON_SHIPMENT_VALUE.
    public static final List<String> VALID_COUPONS = List.of("ALUMNODUOC", "ENVIOGRATIS", "FREECODE");

    private CouponCatalog() {
    }

    public static String normalize(String coupon) {
        return coupon == null ? "" : coupon.trim().toUpperCase(Locale.ROOT);
    }

    public static boolean isValid(String coupon) {
        return VALID_COUPONS.contains(normalize(coupon));
    }

    public static String describe(String coupon) {
        return "Cupon " + normalize(coupon) + " \u00b7 Envio $1.000";
    }
}
