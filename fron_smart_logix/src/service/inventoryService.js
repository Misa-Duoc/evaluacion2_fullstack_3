import { getInventoryRequest, createInventoryItemRequest, reserveInventoryRequest, dispatchInventoryRequest } from "../api/inventoryApi"
import { getRequiredAuthorizationHeader } from "./authService"

export async function getInventory() {
    // El service valida sesion antes de pedir datos al backend.
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getInventoryRequest(authorizationHeader)
}

export async function createInventoryItem(itemData) {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return createInventoryItemRequest(authorizationHeader, itemData)
}

export async function reserveInventory(sku, quantity) {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return reserveInventoryRequest(authorizationHeader, sku, quantity)
}

export async function dispatchInventory(sku, quantity) {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return dispatchInventoryRequest(authorizationHeader, sku, quantity)
}
