import { httpRequest } from "./httpClient"

// El API solo conoce el endpoint y como enviar los datos al backend.
export function loginRequest({ credential, password }) {
    return httpRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            credential,
            password
        })
    })
}
