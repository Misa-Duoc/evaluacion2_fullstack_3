package com.smartlogix.chat.client;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Cuerpo de la peticion al endpoint /openai/v1/chat/completions de Groq
 * (compatible con el formato de OpenAI Chat Completions).
 * https://console.groq.com/docs/api-reference#chat-create
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroqRequest(
        String model,
        List<GroqMessage> messages,
        int max_tokens,
        double temperature
) {
    public record GroqMessage(String role, String content) {
    }
}
