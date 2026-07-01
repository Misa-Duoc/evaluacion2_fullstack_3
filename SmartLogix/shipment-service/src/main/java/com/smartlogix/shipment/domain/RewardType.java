package com.smartlogix.shipment.domain;

/**
 * Catalogo de recompensas que pueden canjearse usando los "puntosDespacho"
 * acumulados por un correo.
 *
 * Regla de negocio (definida por el cliente):
 *  - 20% de descuento en envios  -> 15 puntos.
 *  - 50% de descuento en envios  -> 20 puntos.
 *  - Envio gratis (100%)         -> 25 puntos.
 *
 * El porcentaje de descuento vivia antes en el frontend (Shipments.jsx);
 * ahora es parte del modelo de dominio para que el calculo del valor final
 * del envio se haga exclusivamente en el backend.
 */
public enum RewardType {

    DESCUENTO_20("20% de descuento en envios", 15, 20),
    DESCUENTO_50("50% de descuento en envios", 20, 50),
    ENVIO_GRATIS("Envio gratis", 25, 100);

    private final String descripcion;
    private final int costoEnPuntos;
    private final int descuentoPorcentaje;

    RewardType(String descripcion, int costoEnPuntos, int descuentoPorcentaje) {
        this.descripcion = descripcion;
        this.costoEnPuntos = costoEnPuntos;
        this.descuentoPorcentaje = descuentoPorcentaje;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public int getCostoEnPuntos() {
        return costoEnPuntos;
    }

    public int getDescuentoPorcentaje() {
        return descuentoPorcentaje;
    }
}
