import { httpRequest } from "./httpClient"

// El API recibe el header listo y ejecuta la solicitud HTTP.
export function getInventoryRequest(authorizationHeader) {
    return httpRequest("/api/inventory/items", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

export function createInventoryItemRequest(authorizationHeader, itemData) {
    return httpRequest("/api/inventory/items", {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        },
        body: JSON.stringify(itemData)
    })
}

export function reserveInventoryRequest(authorizationHeader, sku, quantity) {
    return httpRequest(`/api/inventory/items/${sku}/reserve?quantity=${quantity}`, {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        }
    })
}

export function dispatchInventoryRequest(authorizationHeader, sku, quantity) {
    return httpRequest(`/api/inventory/items/${sku}/dispatch?quantity=${quantity}`, {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        }
    })
}
