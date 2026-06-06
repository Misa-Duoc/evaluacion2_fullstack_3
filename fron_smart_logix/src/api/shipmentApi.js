import { httpRequest } from "./httpClient"

// El API mantiene aislada la ruta del recurso de envios.
export function getShipmentRequest(authorizationHeader) {
    return httpRequest("/api/shipments", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}
