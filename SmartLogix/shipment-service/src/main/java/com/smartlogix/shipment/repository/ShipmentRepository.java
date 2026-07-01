package com.smartlogix.shipment.repository;

import com.smartlogix.shipment.domain.Shipment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByTrackingCode(String trackingCode);

    // Usado para resolver a que envio de un correo se le fija un descuento/cupon:
    // se prefiere el mas reciente no entregado; si todos estan entregados, el ultimo.
    List<Shipment> findByCustomerEmailOrderByCreatedAtAsc(String customerEmail);
}
