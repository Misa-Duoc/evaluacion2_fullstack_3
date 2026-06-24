package com.smartlogix.shipment.service;

import com.smartlogix.shipment.domain.DispatchPoints;
import com.smartlogix.shipment.dto.DispatchPointsResponse;
import com.smartlogix.shipment.exception.DispatchPointsNotFoundException;
import com.smartlogix.shipment.repository.DispatchPointsRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Maneja el acumulado de "puntosDespacho" asociado a un correo.
 *
 * Regla de negocio (definida por el cliente):
 *  - Valor inicial de puntosDespacho: 0.
 *  - Cada vez que el mismo correo realiza un nuevo despacho, puntosDespacho se incrementa en +5.
 */
@Service
@Transactional
public class DispatchPointsService {

    private static final int POINTS_PER_REPEATED_DISPATCH = 5;

    private final DispatchPointsRepository repository;

    public DispatchPointsService(DispatchPointsRepository repository) {
        this.repository = repository;
    }

    /**
     * Registra un despacho para el correo indicado y actualiza sus puntosDespacho.
     * Se invoca una vez por cada envio (Shipment) creado.
     */
    public DispatchPoints registerDispatch(String email) {
        String normalizedEmail = normalize(email);

        DispatchPoints points = repository.findByEmail(normalizedEmail)
                .orElseGet(() -> {
                    DispatchPoints newRecord = new DispatchPoints();
                    newRecord.setEmail(normalizedEmail);
                    newRecord.setPuntosDespacho(0);
                    newRecord.setTotalDespachos(0);
                    return newRecord;
                });

        if (points.getId() != null) {
            // El correo ya tenia despachos previos: se repite -> suma puntos.
            points.setPuntosDespacho(points.getPuntosDespacho() + POINTS_PER_REPEATED_DISPATCH);
        }
        points.setTotalDespachos(points.getTotalDespachos() + 1);

        return repository.save(points);
    }

    @Transactional(readOnly = true)
    public DispatchPointsResponse getPointsByEmail(String email) {
        String normalizedEmail = normalize(email);
        DispatchPoints points = repository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new DispatchPointsNotFoundException(
                        "No hay puntosDespacho registrados para el correo " + normalizedEmail));
        return toResponse(points);
    }

    /**
     * Lectura simple usada para mostrar el saldo de puntos junto a un envio,
     * sin lanzar excepcion si el correo todavia no tiene registro.
     */
    @Transactional(readOnly = true)
    public int findCurrentPoints(String email) {
        return repository.findByEmail(normalize(email))
                .map(DispatchPoints::getPuntosDespacho)
                .orElse(0);
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private DispatchPointsResponse toResponse(DispatchPoints points) {
        return new DispatchPointsResponse(
                points.getEmail(),
                points.getPuntosDespacho(),
                points.getTotalDespachos(),
                points.getUpdatedAt()
        );
    }
}
