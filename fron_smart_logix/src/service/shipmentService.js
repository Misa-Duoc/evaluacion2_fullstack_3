import { getShipmentRequest, getShipmentByTrackingRequest, updateShipmentStatusRequest, getDispatchPointsRequest } from "../api/shipmentApi"
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
