package com.smartlogix.shipment.repository;

import com.smartlogix.shipment.domain.DispatchPoints;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DispatchPointsRepository extends JpaRepository<DispatchPoints, Long> {

    Optional<DispatchPoints> findByEmail(String email);
}
