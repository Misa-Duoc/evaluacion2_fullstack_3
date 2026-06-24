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

// Consulta los puntosDespacho acumulados para un correo especifico.
export function getDispatchPointsRequest(authorizationHeader, email) {
    return httpRequest(`/api/shipments/points/${encodeURIComponent(email)}`, {
        headers: {
            Authorization: authorizationHeader
        }
    })
}
