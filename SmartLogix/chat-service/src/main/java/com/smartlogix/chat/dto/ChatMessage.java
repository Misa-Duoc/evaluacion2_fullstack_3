package com.smartlogix.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Un turno de la conversacion, tal como lo maneja el frontend y tal como lo
 * espera la API de Groq (compatible con OpenAI): role = "user" | "assistant".
 */
public record ChatMessage(
        @NotBlank
        @Pattern(regexp = "user|assistant", message = "role debe ser 'user' o 'assistant'")
        String role,

        @NotBlank
        String content
) {
}
