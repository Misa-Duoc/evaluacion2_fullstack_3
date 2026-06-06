import { httpRequest } from "./httpClient"

// El API recibe el header listo y ejecuta la solicitud HTTP.
export function getInventoryRequest(authorizationHeader) {
    return httpRequest("/api/inventory/items", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}
