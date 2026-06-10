import { httpRequest } from "./httpClient"

// El API mantiene aislada la ruta del recurso de ordenes.
export function getOrdersRequest(authorizationHeader) {
    return httpRequest("/api/orders", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}

export function createOrderRequest(authorizationHeader, orderData) {
    return httpRequest("/api/orders", {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        },
        body: JSON.stringify(orderData)
    })
}

export function getOrderByNumberRequest(authorizationHeader, orderNumber) {
    return httpRequest(`/api/orders/${orderNumber}`, {
        headers: {
            Authorization: authorizationHeader
        }
    })
}
