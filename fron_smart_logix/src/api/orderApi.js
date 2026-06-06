import { httpRequest } from "./httpClient"

// El API mantiene aislada la ruta del recurso de ordenes.
export function getOrdersRequest(authorizationHeader) {
    return httpRequest("/api/orders", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}
