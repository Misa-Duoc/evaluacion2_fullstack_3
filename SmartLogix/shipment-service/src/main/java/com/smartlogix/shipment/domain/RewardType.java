package com.smartlogix.shipment.domain;

/**
 * Catalogo de recompensas que pueden canjearse usando los "puntosDespacho"
 * acumulados por un correo.
 *
 * Regla de negocio (definida por el cliente):
 *  - 20% de descuento en envios  -> 15 puntos.
 *  - 50% de descuento en envios  -> 20 puntos.
 *  - Envio gratis                -> 25 puntos.
 */
public enum RewardType {

    DESCUENTO_20("20% de descuento en envios", 15),
    DESCUENTO_50("50% de descuento en envios", 20),
    ENVIO_GRATIS("Envio gratis", 25);

    private final String descripcion;
    private final int costoEnPuntos;

    RewardType(String descripcion, int costoEnPuntos) {
        this.descripcion = descripcion;
        this.costoEnPuntos = costoEnPuntos;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public int getCostoEnPuntos() {
        return costoEnPuntos;
    }
}
