import { getShipmentRequest } from "../api/shipmentApi"
import { getRequiredAuthorizationHeader } from "./authService"

export async function getShipment() {
    // El service valida sesion antes de pedir datos al backend.
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getShipmentRequest(authorizationHeader)
}
