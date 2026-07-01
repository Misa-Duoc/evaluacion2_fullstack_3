package com.smartlogix.shipment.service;

import com.smartlogix.shipment.domain.DispatchPoints;
import com.smartlogix.shipment.domain.RewardType;
import com.smartlogix.shipment.domain.Shipment;
import com.smartlogix.shipment.domain.ShipmentStatus;
import com.smartlogix.shipment.dto.CreateShipmentRequest;
import com.smartlogix.shipment.dto.ShipmentResponse;
import com.smartlogix.shipment.exception.ShipmentNotFoundException;
import com.smartlogix.shipment.factory.ShipmentPlan;
import com.smartlogix.shipment.factory.ShipmentPlanFactory;
import com.smartlogix.shipment.factory.ShipmentPlanFactoryResolver;
import com.smartlogix.shipment.repository.ShipmentRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository repository;
    private final ShipmentPlanFactoryResolver planFactoryResolver;
    private final DispatchPointsService dispatchPointsService;
    private final ShipmentPricingService pricingService;

    public ShipmentService(
            ShipmentRepository repository,
            ShipmentPlanFactoryResolver planFactoryResolver,
            DispatchPointsService dispatchPointsService,
            ShipmentPricingService pricingService
    ) {
        this.repository = repository;
        this.planFactoryResolver = planFactoryResolver;
        this.dispatchPointsService = dispatchPointsService;
        this.pricingService = pricingService;
    }

    public ShipmentResponse createShipment(CreateShipmentRequest request) {
        String destinationAddress = request.destinationAddress().trim();
        String normalizedAddress = destinationAddress.toLowerCase(Locale.ROOT);
        ShipmentPlanFactory planFactory = planFactoryResolver.resolve(normalizedAddress);
        ShipmentPlan shipmentPlan = planFactory.createPlan(normalizedAddress);

        Shipment shipment = new Shipment();
        shipment.setOrderNumber(request.orderNumber().trim().toUpperCase());
        shipment.setCustomerEmail(request.customerEmail().trim().toLowerCase(Locale.ROOT));
        shipment.setDestinationAddress(destinationAddress);
        shipment.setTotalUnits(request.totalUnits());
        shipment.setCarrier(shipmentPlan.carrier());
        shipment.setRouteCode(shipmentPlan.routeCode());
        shipment.setEstimatedDeliveryDate(LocalDate.now().plusDays(shipmentPlan.estimatedDeliveryDays()));
        shipment.setStatus(ShipmentStatus.PLANNED);
        shipment.setTrackingCode("SLX-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());

        // El valor del envio se genera y persiste aqui (antes se calculaba en el
        // frontend). Sin descuentos aun, el valor final es igual al base.
        int baseValue = pricingService.generateBaseValue(shipment.getTrackingCode());
        shipment.setBaseValue(baseValue);
        shipment.setFinalValue(baseValue);

        Shipment savedShipment = repository.save(shipment);

        // Cada despacho creado suma (o inicializa) los puntosDespacho del correo asociado.
        DispatchPoints points = dispatchPointsService.registerDispatch(savedShipment.getCustomerEmail());

        return toResponse(savedShipment, points.getPuntosDespacho());
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> getShipments() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getByTrackingCode(String trackingCode) {
        Shipment shipment = repository.findByTrackingCode(trackingCode.trim().toUpperCase())
                .orElseThrow(() -> new ShipmentNotFoundException("No existe el envio " + trackingCode));
        return toResponse(shipment);
    }

    public ShipmentResponse updateStatus(String trackingCode, ShipmentStatus status) {
        Shipment shipment = repository.findByTrackingCode(trackingCode.trim().toUpperCase())
                .orElseThrow(() -> new ShipmentNotFoundException("No existe el envio " + trackingCode));
        shipment.setStatus(status);
        return toResponse(repository.save(shipment));
    }

    // ---------------------------------------------------------------------
    // Aplicacion de descuentos/cupones a un envio (usado por los servicios de
    // canje de puntos y de cupones). Toda la resolucion de "a que envio se fija"
    // vive ahora en el backend, no en el frontend.
    // ---------------------------------------------------------------------

    /**
     * Resuelve el envio destino de un descuento/cupon para un correo:
     *  - Si se entrega trackingCode, se usa ese envio exacto.
     *  - Si no, se prefiere el envio mas reciente que aun no este DELIVERED;
     *    si todos ya se entregaron, se usa el ultimo de la lista.
     * Devuelve null si el correo no tiene envios.
     */
    public Shipment resolveTargetShipment(String email, String trackingCode) {
        if (trackingCode != null && !trackingCode.isBlank()) {
            return repository.findByTrackingCode(trackingCode.trim().toUpperCase())
                    .orElseThrow(() -> new ShipmentNotFoundException("No existe el envio " + trackingCode));
        }

        List<Shipment> shipments = repository.findByCustomerEmailOrderByCreatedAtAsc(
                email.trim().toLowerCase(Locale.ROOT));
        if (shipments.isEmpty()) {
            return null;
        }

        Shipment fallback = shipments.get(shipments.size() - 1);
        return shipments.stream()
                .filter(s -> s.getStatus() != ShipmentStatus.DELIVERED)
                .reduce((first, second) -> second) // ultimo no entregado
                .orElse(fallback);
    }

    /**
     * Fija un descuento por puntos (porcentaje) a un envio y recalcula su valor.
     */
    public Shipment applyRewardToShipment(Shipment shipment, RewardType rewardType, String descripcion) {
        shipment.setAppliedRewardType(rewardType);
        shipment.setDiscountDescription(descripcion);
        pricingService.recalculateFinalValue(shipment);
        return repository.save(shipment);
    }

    /**
     * Fija un cupon (codigo) a un envio, dejandolo en su valor fijo, y recalcula.
     */
    public Shipment applyCouponToShipment(Shipment shipment, String couponCode, String descripcion) {
        shipment.setAppliedCouponCode(couponCode);
        shipment.setDiscountDescription(descripcion);
        pricingService.recalculateFinalValue(shipment);
        return repository.save(shipment);
    }

    /**
     * Quita el cupon fijado a un envio (si lo tiene) y recalcula su valor,
     * conservando un eventual descuento por puntos.
     */
    public void clearCouponFromShipment(String trackingCode) {
        if (trackingCode == null || trackingCode.isBlank()) {
            return;
        }
        repository.findByTrackingCode(trackingCode.trim().toUpperCase()).ifPresent(shipment -> {
            shipment.setAppliedCouponCode(null);
            if (shipment.getAppliedRewardType() == null) {
                shipment.setDiscountDescription(null);
            }
            pricingService.recalculateFinalValue(shipment);
            repository.save(shipment);
        });
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        int currentPoints = dispatchPointsService.findCurrentPoints(shipment.getCustomerEmail());
        return toResponse(shipment, currentPoints);
    }

    private ShipmentResponse toResponse(Shipment shipment, int puntosDespacho) {
        return new ShipmentResponse(
                shipment.getTrackingCode(),
                shipment.getOrderNumber(),
                shipment.getCustomerEmail(),
                shipment.getCarrier(),
                shipment.getRouteCode(),
                shipment.getEstimatedDeliveryDate(),
                shipment.getStatus(),
                shipment.getCreatedAt(),
                puntosDespacho,
                shipment.getBaseValue(),
                shipment.getFinalValue(),
                shipment.getAppliedCouponCode(),
                shipment.getAppliedRewardType() != null ? shipment.getAppliedRewardType().name() : null,
                shipment.getDiscountDescription()
        );
    }
}
