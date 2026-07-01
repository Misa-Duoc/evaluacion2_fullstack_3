package com.smartlogix.shipment.service;

import com.smartlogix.shipment.domain.DispatchPoints;
import com.smartlogix.shipment.domain.RewardRedemption;
import com.smartlogix.shipment.domain.RewardType;
import com.smartlogix.shipment.domain.Shipment;
import com.smartlogix.shipment.dto.RedeemPointsResponse;
import com.smartlogix.shipment.dto.RewardCatalogItem;
import com.smartlogix.shipment.exception.InsufficientPointsException;
import com.smartlogix.shipment.repository.DispatchPointsRepository;
import com.smartlogix.shipment.repository.RewardRedemptionRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Maneja el item "Canje de ptos": permite cambiar puntosDespacho acumulados
 * por un correo (ver DispatchPoints) por descuentos de envio.
 *
 * Regla de negocio (definida por el cliente):
 *  - 20% de descuento en envios  -> 15 puntos.
 *  - 50% de descuento en envios  -> 20 puntos.
 *  - Envio gratis                -> 25 puntos.
 *
 * Ademas de descontar los puntos, el canje ahora FIJA el descuento al envio
 * correspondiente en el backend (antes esto se hacia en el frontend con
 * localStorage). Asi, el valor final del envio queda calculado y persistido
 * del lado del servidor.
 */
@Service
@Transactional
public class RewardRedemptionService {

    private final DispatchPointsRepository dispatchPointsRepository;
    private final RewardRedemptionRepository rewardRedemptionRepository;
    private final ShipmentService shipmentService;

    public RewardRedemptionService(
            DispatchPointsRepository dispatchPointsRepository,
            RewardRedemptionRepository rewardRedemptionRepository,
            ShipmentService shipmentService
    ) {
        this.dispatchPointsRepository = dispatchPointsRepository;
        this.rewardRedemptionRepository = rewardRedemptionRepository;
        this.shipmentService = shipmentService;
    }

    /**
     * Expone el catalogo fijo de descuentos que se pueden canjear con puntos.
     */
    public List<RewardCatalogItem> getCatalog() {
        return List.of(
                toCatalogItem(RewardType.DESCUENTO_20),
                toCatalogItem(RewardType.DESCUENTO_50),
                toCatalogItem(RewardType.ENVIO_GRATIS)
        );
    }

    public RedeemPointsResponse redeem(String email, RewardType rewardType, String trackingCode) {
        String normalizedEmail = normalize(email);

        DispatchPoints points = dispatchPointsRepository.findByEmail(normalizedEmail)
                .orElse(null);

        int puntosActuales = points != null ? points.getPuntosDespacho() : 0;

        if (puntosActuales < rewardType.getCostoEnPuntos()) {
            throw new InsufficientPointsException("No cuenta con el puntaje suficiente");
        }

        points.setPuntosDespacho(puntosActuales - rewardType.getCostoEnPuntos());
        dispatchPointsRepository.save(points);

        RewardRedemption redemption = new RewardRedemption();
        redemption.setEmail(normalizedEmail);
        redemption.setRewardType(rewardType);
        redemption.setPuntosUsados(rewardType.getCostoEnPuntos());
        rewardRedemptionRepository.save(redemption);

        // Fija el descuento al envio correspondiente del correo (al exacto si se
        // entrego trackingCode; si no, al mas reciente no entregado). El valor
        // final del envio se recalcula y persiste en el backend.
        String appliedTrackingCode = null;
        Integer valorEnvioFinal = null;
        Shipment target = shipmentService.resolveTargetShipment(normalizedEmail, trackingCode);
        if (target != null) {
            Shipment updated = shipmentService.applyRewardToShipment(
                    target, rewardType, rewardType.getDescripcion());
            appliedTrackingCode = updated.getTrackingCode();
            valorEnvioFinal = updated.getFinalValue();
        }

        return new RedeemPointsResponse(
                normalizedEmail,
                rewardType.name(),
                rewardType.getDescripcion(),
                rewardType.getCostoEnPuntos(),
                points.getPuntosDespacho(),
                "Su descuento se a conseguido con exito",
                appliedTrackingCode,
                valorEnvioFinal
        );
    }

    private RewardCatalogItem toCatalogItem(RewardType rewardType) {
        return new RewardCatalogItem(
                rewardType.name(),
                rewardType.getDescripcion(),
                rewardType.getCostoEnPuntos()
        );
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
