package com.smartlogix.shipment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterCouponRequest(
        @NotBlank @Email String email,
        @NotBlank String coupon
) {
}
