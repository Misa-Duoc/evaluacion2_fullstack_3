package com.smartlogix.shipment.service;

import com.smartlogix.shipment.catalog.CouponCatalog;
import com.smartlogix.shipment.domain.RewardType;
import com.smartlogix.shipment.domain.Shipment;
import org.springframework.stereotype.Service;

/**
 * Centraliza el calculo del valor de un envio. Toda esta logica vivia antes en
 * el frontend (Shipments.jsx: baseValueForTracking + computeShipmentValues) y
 * ahora es la unica fuente de verdad en el backend.
 *
 * Reglas:
 *  - El valor base se deriva de forma deterministica del trackingCode (entre
 *    $1.000 y $10.000, redondeado a la decena) para que sea estable y no se
 *    deba "simular" un monto distinto en cada render.
 *  - El valor final aplica, con prioridad, el cupon por codigo (valor fijo) y,
 *    en su defecto, el descuento por puntos (porcentaje sobre el valor base).
 *  - Blindajes: un descuento jamas puede aumentar el precio (final <= base) y
 *    un porcentaje invalido se ignora en vez de aplicarse.
 */
@Service
public class ShipmentPricingService {

    /**
     * Reproduce exactamente el hash que usaba el frontend para que el valor base
     * de cada envio sea identico al que se mostraba antes.
     */
    public int generateBaseValue(String trackingCode) {
        int hash = 0;
        for (int i = 0; i < trackingCode.length(); i++) {
            hash = (hash << 5) - hash + trackingCode.charAt(i);
        }
        long positiveHash = Math.abs((long) hash);
        long value = 1000 + (positiveHash % 9001); // rango 1000 - 10000
        return (int) (Math.round(value / 10.0) * 10);
    }

    /**
     * Recalcula y fija el valor final del envio segun el cupon y/o descuento que
     * tenga aplicado. El cupon (codigo) tiene prioridad sobre el descuento por puntos.
     */
    public void recalculateFinalValue(Shipment shipment) {
        int base = shipment.getBaseValue() > 0
                ? shipment.getBaseValue()
                : generateBaseValue(shipment.getTrackingCode());
        shipment.setBaseValue(base);

        if (shipment.getAppliedCouponCode() != null) {
            // El cupon deja el envio en un valor fijo (nunca por encima del base).
            shipment.setFinalValue(Math.min(base, CouponCatalog.COUPON_SHIPMENT_VALUE));
            return;
        }

        RewardType reward = shipment.getAppliedRewardType();
        if (reward != null) {
            int percent = reward.getDescuentoPorcentaje();
            if (percent >= 0 && percent <= 100) {
                int discounted = (int) Math.round(base * (1.0 - percent / 100.0));
                shipment.setFinalValue(Math.min(base, Math.max(0, discounted)));
                return;
            }
        }

        shipment.setFinalValue(base);
    }
}
