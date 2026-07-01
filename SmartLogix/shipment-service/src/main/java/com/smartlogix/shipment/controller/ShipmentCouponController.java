package com.smartlogix.shipment.controller;

import com.smartlogix.shipment.catalog.CouponCatalog;
import com.smartlogix.shipment.dto.ApplyCouponRequest;
import com.smartlogix.shipment.dto.ApplyCouponResponse;
import com.smartlogix.shipment.dto.CouponCatalogResponse;
import com.smartlogix.shipment.dto.CouponResponse;
import com.smartlogix.shipment.dto.CouponUsageResponse;
import com.smartlogix.shipment.dto.RegisterCouponRequest;
import com.smartlogix.shipment.service.ShipmentCouponService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Cupones de descuento de envio por codigo. Reemplaza couponStorage.js.
 * Vive bajo /api/shipments/coupons/** para reutilizar la ruta del api-gateway
 * (Path=/api/shipments/**) sin tocar su configuracion.
 */
@RestController
@RequestMapping("/api/shipments/coupons")
public class ShipmentCouponController {

    private final ShipmentCouponService couponService;

    public ShipmentCouponController(ShipmentCouponService couponService) {
        this.couponService = couponService;
    }

    /** Codigos validos + valor fijo de envio (antes hardcodeado en el frontend). */
    @GetMapping("/catalog")
    public CouponCatalogResponse getCatalog() {
        return new CouponCatalogResponse(CouponCatalog.VALID_COUPONS, CouponCatalog.COUPON_SHIPMENT_VALUE);
    }

    /** Lista todos los cupones registrados (pagina "Descuento"). */
    @GetMapping
    public List<CouponResponse> listAll() {
        return couponService.listAll();
    }

    /** Estado de uso del cupon de un correo (pagina "Ordenes"). */
    @GetMapping("/{email}")
    public CouponUsageResponse getUsage(@PathVariable String email) {
        return couponService.getUsage(email);
    }

    /** Asocia un cupon a un correo. */
    @PostMapping
    public CouponResponse register(@Valid @RequestBody RegisterCouponRequest request) {
        return couponService.register(request.email(), request.coupon());
    }

    /** Aplica el cupon disponible de un correo a un envio. */
    @PostMapping("/{email}/apply")
    public ApplyCouponResponse apply(
            @PathVariable String email,
            @RequestBody(required = false) ApplyCouponRequest request
    ) {
        String trackingCode = request != null ? request.trackingCode() : null;
        return couponService.apply(email, trackingCode);
    }

    /** Quita el cupon de un correo. */
    @DeleteMapping("/{email}")
    public void remove(@PathVariable String email) {
        couponService.remove(email);
    }
}
