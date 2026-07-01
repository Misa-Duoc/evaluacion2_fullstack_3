package com.smartlogix.shipment.exception;

/**
 * Error de negocio al registrar o aplicar un cupon de descuento de envio
 * (codigo invalido, cupon ya utilizado por el correo, etc.). Se responde 400.
 */
public class CouponOperationException extends RuntimeException {

    public CouponOperationException(String message) {
        super(message);
    }
}
