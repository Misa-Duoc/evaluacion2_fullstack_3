package com.smartlogix.chat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Peticion del frontend: el mensaje nuevo del usuario + el historial previo
 * de la conversacion (el chat-service es sin estado; el historial completo
 * viaja en cada llamada, igual que se hace contra la API de Groq).
 */
public record ChatRequest(
        @NotBlank(message = "El mensaje no puede estar vacio")
        @Size(max = 2000, message = "El mensaje es demasiado largo (maximo 2000 caracteres)")
        String message,

        @Valid
        @Size(max = 40, message = "El historial de la conversacion es demasiado largo")
        List<ChatMessage> history
) {
}
