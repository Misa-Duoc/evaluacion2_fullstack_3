import { getInventoryRequest } from "../api/inventoryApi"
import { getRequiredAuthorizationHeader } from "./authService"

export async function getInventory() {
    // El service valida sesion antes de pedir datos al backend.
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getInventoryRequest(authorizationHeader)
}
