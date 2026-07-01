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

// Obtiene el catalogo de descuentos disponibles para canjear con puntos.
export function getRewardCatalogRequest(authorizationHeader) {
    return httpRequest("/api/shipments/points/catalog", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

// Canjea los puntosDespacho de un correo por el descuento elegido.
export function redeemPointsRequest(authorizationHeader, email, rewardType) {
    return httpRequest(`/api/shipments/points/${encodeURIComponent(email)}/redeem`, {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        },
        body: JSON.stringify({ rewardType })
    })
}
