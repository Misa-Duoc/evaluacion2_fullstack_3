package com.smartlogix.shipment.controller;

import com.smartlogix.shipment.dto.DispatchPointsResponse;
import com.smartlogix.shipment.dto.RedeemPointsRequest;
import com.smartlogix.shipment.dto.RedeemPointsResponse;
import com.smartlogix.shipment.dto.RewardCatalogItem;
import com.smartlogix.shipment.service.DispatchPointsService;
import com.smartlogix.shipment.service.RewardRedemptionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expone la consulta de "puntosDespacho" acumulados por correo y el
 * item "Canje de ptos" (catalogo de descuentos y canje de los mismos).
 * Vive bajo /api/shipments/points/** para reutilizar la ruta ya expuesta
 * en el api-gateway (Path=/api/shipments/**), sin tener que tocar su configuracion.
 */
@RestController
@RequestMapping("/api/shipments/points")
public class DispatchPointsController {

    private final DispatchPointsService dispatchPointsService;
    private final RewardRedemptionService rewardRedemptionService;

    public DispatchPointsController(
            DispatchPointsService dispatchPointsService,
            RewardRedemptionService rewardRedemptionService
    ) {
        this.dispatchPointsService = dispatchPointsService;
        this.rewardRedemptionService = rewardRedemptionService;
    }

    @GetMapping("/{email}")
    public DispatchPointsResponse getPointsByEmail(@PathVariable String email) {
        return dispatchPointsService.getPointsByEmail(email);
    }

    /**
     * Catalogo fijo de descuentos de envio que se pueden canjear con puntos.
     */
    @GetMapping("/catalog")
    public List<RewardCatalogItem> getCatalog() {
        return rewardRedemptionService.getCatalog();
    }

    /**
     * Canjea los puntosDespacho del correo indicado por el descuento elegido y
     * fija el descuento al envio correspondiente. Si no cuenta con el puntaje
     * suficiente, se responde 400 con "No cuenta con el puntaje suficiente".
     */
    @PostMapping("/{email}/redeem")
    public RedeemPointsResponse redeem(
            @PathVariable String email,
            @Valid @RequestBody RedeemPointsRequest request
    ) {
        return rewardRedemptionService.redeem(email, request.rewardType(), request.trackingCode());
    }
}
