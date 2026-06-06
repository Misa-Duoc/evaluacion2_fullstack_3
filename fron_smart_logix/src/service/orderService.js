import { getOrdersRequest } from "../api/orderApi"
import { getRequiredAuthorizationHeader } from "./authService"

export async function getOrders() {
    // El service valida sesion antes de pedir datos al backend.
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getOrdersRequest(authorizationHeader)
}
