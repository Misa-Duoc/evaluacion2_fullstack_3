package com.smartlogix.shipment.service;

import com.smartlogix.shipment.domain.DispatchPoints;
import com.smartlogix.shipment.domain.RewardRedemption;
import com.smartlogix.shipment.domain.RewardType;
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
 * Si el correo no cuenta con el puntaje suficiente se informa mediante
 * InsufficientPointsException ("No cuenta con el puntaje suficiente").
 * Si el canje se concreta, se descuentan los puntos usados y se informa
 * exito ("Su descuento se a conseguido con exito").
 */
@Service
@Transactional
public class RewardRedemptionService {

    private final DispatchPointsRepository dispatchPointsRepository;
    private final RewardRedemptionRepository rewardRedemptionRepository;

    public RewardRedemptionService(
            DispatchPointsRepository dispatchPointsRepository,
            RewardRedemptionRepository rewardRedemptionRepository
    ) {
        this.dispatchPointsRepository = dispatchPointsRepository;
        this.rewardRedemptionRepository = rewardRedemptionRepository;
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

    public RedeemPointsResponse redeem(String email, RewardType rewardType) {
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

        return new RedeemPointsResponse(
                normalizedEmail,
                rewardType.name(),
                rewardType.getDescripcion(),
                rewardType.getCostoEnPuntos(),
                points.getPuntosDespacho(),
                "Su descuento se a conseguido con exito"
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
