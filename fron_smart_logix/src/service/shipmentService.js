import {
    getShipmentRequest,
    getShipmentByTrackingRequest,
    updateShipmentStatusRequest,
    getDispatchPointsRequest,
    getRewardCatalogRequest,
    redeemPointsRequest,
    getCouponCatalogRequest,
    listCouponsRequest,
    getCouponUsageRequest,
    registerCouponRequest,
    applyCouponRequest,
    removeCouponRequest
} from "../api/shipmentApi"
import { getRequiredAuthorizationHeader } from "./authService"

export async function getShipment() {
    // El service valida sesion antes de pedir datos al backend.
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getShipmentRequest(authorizationHeader)
}

export async function getShipmentByTracking(trackingCode) {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getShipmentByTrackingRequest(authorizationHeader, trackingCode)
}

export async function updateShipmentStatus(trackingCode, status) {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return updateShipmentStatusRequest(authorizationHeader, trackingCode, status)
}

export async function getDispatchPoints(email) {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
        throw new Error("Ingrese un correo para consultar sus puntos")
    }

    const authorizationHeader = getRequiredAuthorizationHeader()
    return getDispatchPointsRequest(authorizationHeader, cleanEmail)
}

export async function getRewardCatalog() {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getRewardCatalogRequest(authorizationHeader)
}

export async function redeemPoints(email, rewardType, trackingCode) {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
        throw new Error("Ingrese un correo para canjear sus puntos")
    }
    if (!rewardType) {
        throw new Error("Seleccione un descuento para canjear")
    }

    const authorizationHeader = getRequiredAuthorizationHeader()
    return redeemPointsRequest(authorizationHeader, cleanEmail, rewardType, trackingCode)
}

// ---------------------------------------------------------------------------
// Cupones de descuento de envio (la logica de negocio vive en el backend).
// ---------------------------------------------------------------------------

export async function getCouponCatalog() {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getCouponCatalogRequest(authorizationHeader)
}

export async function listCoupons() {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return listCouponsRequest(authorizationHeader)
}

export async function getCouponUsage(email) {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
        return { email: "", state: "none", coupon: null, descripcion: null }
    }
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getCouponUsageRequest(authorizationHeader, cleanEmail)
}

export async function registerCoupon(email, coupon) {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
        throw new Error("Ingrese el correo al que se asociara el descuento")
    }
    if (!coupon || !coupon.trim()) {
        throw new Error("Ingrese la palabra del cupon de descuento")
    }

    const authorizationHeader = getRequiredAuthorizationHeader()
    return registerCouponRequest(authorizationHeader, cleanEmail, coupon.trim().toUpperCase())
}

export async function applyCoupon(email, trackingCode) {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
        throw new Error("Ingrese el correo del cliente")
    }

    const authorizationHeader = getRequiredAuthorizationHeader()
    return applyCouponRequest(authorizationHeader, cleanEmail, trackingCode)
}

export async function removeCoupon(email) {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return removeCouponRequest(authorizationHeader, email.trim().toLowerCase())
}
