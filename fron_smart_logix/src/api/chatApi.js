import { httpRequest } from "./httpClient"

// El API solo conoce el endpoint del asistente y como enviar los datos al backend.
export function sendChatMessageRequest(authorizationHeader, message, history) {
    return httpRequest("/api/chat", {
        method: "POST",
        headers: {
            Authorization: authorizationHeader
        },
        body: JSON.stringify({ message, history })
    })
}
