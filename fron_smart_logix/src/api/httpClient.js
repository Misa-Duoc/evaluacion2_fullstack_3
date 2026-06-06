const API_URL_BASE = "http://localhost:8080"

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
        throw new Error(data?.message || "Error en la solicitud al backend")
    }

    return data
}

export { API_URL_BASE }
