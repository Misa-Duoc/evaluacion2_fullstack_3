package com.smartlogix.shipment.repository;

import com.smartlogix.shipment.domain.RewardRedemption;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RewardRedemptionRepository extends JpaRepository<RewardRedemption, Long> {

    List<RewardRedemption> findByEmailOrderByCreatedAtDesc(String email);
}
