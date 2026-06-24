package com.smartlogix.shipment.controller;

import com.smartlogix.shipment.dto.DispatchPointsResponse;
import com.smartlogix.shipment.service.DispatchPointsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expone la consulta de "puntosDespacho" acumulados por correo.
 * Vive bajo /api/shipments/points/** para reutilizar la ruta ya expuesta
 * en el api-gateway (Path=/api/shipments/**), sin tener que tocar su configuracion.
 */
@RestController
@RequestMapping("/api/shipments/points")
public class DispatchPointsController {

    private final DispatchPointsService dispatchPointsService;

    public DispatchPointsController(DispatchPointsService dispatchPointsService) {
        this.dispatchPointsService = dispatchPointsService;
    }

    @GetMapping("/{email}")
    public DispatchPointsResponse getPointsByEmail(@PathVariable String email) {
        return dispatchPointsService.getPointsByEmail(email);
    }
}
