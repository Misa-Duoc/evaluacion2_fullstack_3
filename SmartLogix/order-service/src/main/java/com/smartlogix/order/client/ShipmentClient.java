package com.smartlogix.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class ShipmentClient {

    private static final Logger log = LoggerFactory.getLogger(ShipmentClient.class);

    private final RestTemplate restTemplate;
    private final CircuitBreakerFactory<?, ?> circuitBreakerFactory;

    public ShipmentClient(RestTemplate restTemplate, CircuitBreakerFactory<?, ?> circuitBreakerFactory) {
        this.restTemplate = restTemplate;
        this.circuitBreakerFactory = circuitBreakerFactory;
    }

    public ShipmentResponse requestShipment(ShipmentRequest request) {
        // IMPORTANTE: Resilience4j ejecuta este supplier en un hilo de pool distinto al
        // de la peticion HTTP original (por el TimeLimiter que usa Spring Cloud Circuit
        // Breaker por defecto). RequestContextHolder es un ThreadLocal, asi que si lo
        // leemos DENTRO del supplier ya es tarde: ese hilo nunca tuvo la peticion original.
        // Por eso el token se captura aqui afuera, en el hilo correcto, y se pasa explicito.
        String authorization = currentAuthorizationHeader();

        return circuitBreakerFactory.create("shipmentService").run(
                () -> doRequestShipment(request, authorization),
                throwable -> fallbackResponse(request, throwable)
        );
    }

    private ShipmentResponse doRequestShipment(ShipmentRequest request, String authorization) {
        HttpHeaders headers = new HttpHeaders();
        if (StringUtils.hasText(authorization)) {
            headers.set(HttpHeaders.AUTHORIZATION, authorization);
        }

        HttpEntity<ShipmentRequest> entity = new HttpEntity<>(request, headers);
        return restTemplate.exchange(
                "http://shipment-service/api/shipments",
                HttpMethod.POST,
                entity,
                ShipmentResponse.class
        ).getBody();
    }

    private String currentAuthorizationHeader() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
        }
        return null;
    }

    private ShipmentResponse fallbackResponse(ShipmentRequest request, Throwable throwable) {
        log.error("Fallo la solicitud de despacho a shipment-service para la orden {}: {}",
                request.orderNumber(), throwable.toString(), throwable);
        return new ShipmentResponse(
                null,
                request.orderNumber(),
                "NO_CARRIER",
                "NO_ROUTE",
                null,
                "PENDING_MANUAL_ASSIGNMENT"
        );
    }
}
