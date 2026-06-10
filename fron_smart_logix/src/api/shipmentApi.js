import { httpRequest } from "./httpClient"

// El API mantiene aislada la ruta del recurso de envios.
export function getShipmentRequest(authorizationHeader) {
    return httpRequest("/api/shipments", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

export function getShipmentByTrackingRequest(authorizationHeader, trackingCode) {
    return httpRequest(`/api/shipments/${trackingCode}`, {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

export function updateShipmentStatusRequest(authorizationHeader, trackingCode, status) {
    return httpRequest(`/api/shipments/${trackingCode}/status?value=${status}`, {
        method: "PATCH",
        headers: {
            Authorization: authorizationHeader
        }
    })
}
