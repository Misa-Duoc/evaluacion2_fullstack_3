package com.smartlogix.shipment.repository;

import com.smartlogix.shipment.domain.ShipmentCoupon;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentCouponRepository extends JpaRepository<ShipmentCoupon, Long> {

    Optional<ShipmentCoupon> findByEmail(String email);

    List<ShipmentCoupon> findAllByOrderByUpdatedAtDesc();
}
