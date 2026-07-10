package com.smartlogix.chat.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Respuesta cruda del endpoint /openai/v1/chat/completions de Groq.
 * Solo mapeamos los campos que necesitamos; el resto se ignora.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GroqResponse(
        List<Choice> choices
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Choice(Message message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Message(String role, String content) {
    }
}
