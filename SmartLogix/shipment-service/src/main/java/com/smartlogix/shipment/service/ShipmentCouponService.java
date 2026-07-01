package com.smartlogix.shipment.service;

import com.smartlogix.shipment.catalog.CouponCatalog;
import com.smartlogix.shipment.domain.CouponStatus;
import com.smartlogix.shipment.domain.Shipment;
import com.smartlogix.shipment.domain.ShipmentCoupon;
import com.smartlogix.shipment.dto.ApplyCouponResponse;
import com.smartlogix.shipment.dto.CouponResponse;
import com.smartlogix.shipment.dto.CouponUsageResponse;
import com.smartlogix.shipment.exception.CouponOperationException;
import com.smartlogix.shipment.repository.ShipmentCouponRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Maneja los cupones de descuento de envio por codigo. Reemplaza por completo
 * el modulo couponStorage.js del frontend (que guardaba todo en localStorage).
 *
 * Reglas de negocio (ahora en el backend):
 *  - Codigos validos: ALUMNODUOC, ENVIOGRATIS, FREECODE (ver CouponCatalog).
 *  - Un cupon es UNICO por correo: una vez aplicado no puede reutilizarse.
 *  - Asociar un cupon (AVAILABLE) no aplica el descuento; solo marca al correo
 *    como elegible. La aplicacion efectiva (APPLIED) fija el cupon a un envio
 *    concreto, dejandolo en su valor fijo.
 */
@Service
@Transactional
public class ShipmentCouponService {

    private final ShipmentCouponRepository repository;
    private final ShipmentService shipmentService;

    public ShipmentCouponService(
            ShipmentCouponRepository repository,
            ShipmentService shipmentService
    ) {
        this.repository = repository;
        this.shipmentService = shipmentService;
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> listAll() {
        return repository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CouponUsageResponse getUsage(String email) {
        String key = normalize(email);
        ShipmentCoupon coupon = repository.findByEmail(key).orElse(null);
        if (coupon == null) {
            return new CouponUsageResponse(key, "none", null, null);
        }
        String state = coupon.getStatus() == CouponStatus.APPLIED ? "used" : "available";
        return new CouponUsageResponse(key, state, coupon.getCouponCode(), coupon.getDescripcion());
    }

    /**
     * Asocia (deja DISPONIBLE) un cupon a un correo. Valida el codigo y la
     * unicidad por correo (no se puede asociar otro si ya utilizo uno).
     */
    public CouponResponse register(String email, String coupon) {
        String code = CouponCatalog.normalize(coupon);
        if (!CouponCatalog.isValid(code)) {
            throw new CouponOperationException(
                    "El cupon \"" + code + "\" no es valido. Cupones disponibles: "
                            + String.join(", ", CouponCatalog.VALID_COUPONS) + ".");
        }

        String key = normalize(email);
        ShipmentCoupon existing = repository.findByEmail(key).orElse(null);
        if (existing != null && existing.getStatus() == CouponStatus.APPLIED) {
            throw new CouponOperationException(
                    "El correo " + key + " ya utilizo un cupon de descuento. "
                            + "El cupon es unico por correo, no puede recibir otro.");
        }

        ShipmentCoupon entity = existing != null ? existing : new ShipmentCoupon();
        entity.setEmail(key);
        entity.setCouponCode(code);
        entity.setDescripcion(CouponCatalog.describe(code));
        entity.setStatus(CouponStatus.AVAILABLE);
        entity.setTrackingCode(null);

        return toResponse(repository.save(entity));
    }

    /**
     * Aplica efectivamente el cupon disponible de un correo: lo fija a un envio
     * (al exacto si se entrega trackingCode; si no, al mas reciente no entregado)
     * y deja ese envio en su valor fijo. Single-use por correo.
     */
    public ApplyCouponResponse apply(String email, String trackingCode) {
        String key = normalize(email);
        ShipmentCoupon coupon = repository.findByEmail(key).orElse(null);

        if (coupon == null) {
            return new ApplyCouponResponse("none", null, null, null,
                    "El correo " + key + " no tiene un cupon de descuento asociado.");
        }
        if (coupon.getStatus() == CouponStatus.APPLIED) {
            return new ApplyCouponResponse("already_used", coupon.getCouponCode(),
                    coupon.getTrackingCode(), null,
                    "El correo " + key + " ya utilizo su cupon " + coupon.getCouponCode()
                            + " (unico por correo).");
        }

        Shipment target = shipmentService.resolveTargetShipment(key, trackingCode);
        if (target == null) {
            return new ApplyCouponResponse("none", coupon.getCouponCode(), null, null,
                    "El correo " + key + " todavia no tiene envios a los que aplicar el cupon.");
        }

        Shipment updated = shipmentService.applyCouponToShipment(
                target, coupon.getCouponCode(), coupon.getDescripcion());

        coupon.setStatus(CouponStatus.APPLIED);
        coupon.setTrackingCode(updated.getTrackingCode());
        repository.save(coupon);

        return new ApplyCouponResponse("applied", coupon.getCouponCode(),
                updated.getTrackingCode(), updated.getFinalValue(),
                "Cupon " + coupon.getCouponCode() + " aplicado. Envio $1.000.");
    }

    /**
     * Elimina por completo el cupon de un correo y, si estaba aplicado a un
     * envio, restaura el valor de ese envio.
     */
    public void remove(String email) {
        String key = normalize(email);
        repository.findByEmail(key).ifPresent(coupon -> {
            if (coupon.getStatus() == CouponStatus.APPLIED && coupon.getTrackingCode() != null) {
                shipmentService.clearCouponFromShipment(coupon.getTrackingCode());
            }
            repository.delete(coupon);
        });
    }

    private CouponResponse toResponse(ShipmentCoupon coupon) {
        String status = coupon.getStatus() == CouponStatus.APPLIED ? "aplicado" : "disponible";
        return new CouponResponse(
                coupon.getEmail(),
                coupon.getCouponCode(),
                coupon.getDescripcion(),
                status,
                coupon.getTrackingCode()
        );
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
