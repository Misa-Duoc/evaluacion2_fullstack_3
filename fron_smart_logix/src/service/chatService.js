import { sendChatMessageRequest } from "../api/chatApi"
import { getRequiredAuthorizationHeader } from "./authService"

// El chat-service es sin estado: en cada llamada se reenvia el historial
// previo de la conversacion junto con el mensaje nuevo.
export async function sendChatMessage(message, history) {
    const cleanMessage = message.trim()
    if (!cleanMessage) {
        throw new Error("Escribe un mensaje antes de enviarlo")
    }

    const authorizationHeader = getRequiredAuthorizationHeader()
    return sendChatMessageRequest(authorizationHeader, cleanMessage, history ?? [])
}
