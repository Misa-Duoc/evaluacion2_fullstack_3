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

export function registerRequest({ username, email, password }) {
    return httpRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username,
            email,
            password
        })
    })
}

// Valida el token actual contra el backend y devuelve el rol REAL
// (extraido del JWT firmado), no el que quede guardado en localStorage.
export function validateTokenRequest(authorizationHeader) {
    return httpRequest("/api/auth/validate", {
        headers: {
            Authorization: authorizationHeader
        }
    })
}
