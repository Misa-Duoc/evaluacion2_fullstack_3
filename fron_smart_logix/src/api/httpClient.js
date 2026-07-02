const API_URL_BASE = "http://localhost:8080"

// Evento global que se dispara cuando el backend rechaza el token/rol
// (401 = no autenticado, 403 = autenticado pero sin permiso para ese recurso).
// El rol mostrado en el frontend viene de localStorage y NO es fuente de verdad;
// la fuente de verdad es el JWT firmado que valida el backend en cada llamada.
// Si el backend responde 401/403, la sesion local ya no es confiable y se debe
// cerrar sesion de inmediato, sin importar que el menu/UI mostraran otra cosa.
export const AUTH_REJECTED_EVENT = "auth:rejected"

function notifyAuthRejected(status) {
    window.dispatchEvent(new CustomEvent(AUTH_REJECTED_EVENT, { detail: { status } }))
}

// Centraliza la comunicacion HTTP para que los API no repitan fetch y parseo JSON.
export async function httpRequest(path, options = {}) {
    const response = await fetch(`${API_URL_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : null

    if (!response.ok) {
        // 401: token invalido/expirado. 403: token valido pero sin el rol requerido
        // (por ejemplo, alguien forzo "role":"ROLE_ADMIN" en localStorage, pero el
        // JWT real sigue firmado como ROLE_USER). En ambos casos, la sesion local
        // esta desincronizada de la real y hay que cerrarla.
        if (response.status === 401 || response.status === 403) {
            notifyAuthRejected(response.status)
        }
        throw new Error(data?.message || "Error en la solicitud al backend")
    }

    return data
}

export { API_URL_BASE }
