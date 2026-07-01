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

// Canjea los puntosDespacho de un correo por el descuento elegido. Si se entrega
// trackingCode, el backend fija el descuento a ESE envio exacto.
export function redeemPointsRequest(authorizationHeader, email, rewardType, trackingCode) {
    return httpRequest(`/api/shipments/points/${encodeURIComponent(email)}/redeem`, {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        },
        body: JSON.stringify({ rewardType, trackingCode: trackingCode ?? null })
    })
}

// ---------------------------------------------------------------------------
// Cupones de descuento de envio por codigo (antes en couponStorage.js).
// Toda la logica vive ahora en el backend (shipment-service).
// ---------------------------------------------------------------------------

// Catalogo de cupones validos + valor fijo de envio.
export function getCouponCatalogRequest(authorizationHeader) {
    return httpRequest("/api/shipments/coupons/catalog", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

// Lista todos los cupones registrados (pagina "Descuento").
export function listCouponsRequest(authorizationHeader) {
    return httpRequest("/api/shipments/coupons", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

// Estado de uso del cupon de un correo (pagina "Ordenes").
export function getCouponUsageRequest(authorizationHeader, email) {
    return httpRequest(`/api/shipments/coupons/${encodeURIComponent(email)}`, {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

// Asocia un cupon a un correo.
export function registerCouponRequest(authorizationHeader, email, coupon) {
    return httpRequest("/api/shipments/coupons", {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        },
        body: JSON.stringify({ email, coupon })
    })
}

// Aplica el cupon disponible de un correo a un envio (exacto si se entrega trackingCode).
export function applyCouponRequest(authorizationHeader, email, trackingCode) {
    return httpRequest(`/api/shipments/coupons/${encodeURIComponent(email)}/apply`, {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        },
        body: JSON.stringify({ trackingCode: trackingCode ?? null })
    })
}

// Quita el cupon de un correo.
export function removeCouponRequest(authorizationHeader, email) {
    return httpRequest(`/api/shipments/coupons/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: {
            Authorization: authorizationHeader
        }
    })
}
