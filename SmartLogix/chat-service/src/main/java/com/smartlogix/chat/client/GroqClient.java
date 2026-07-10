package com.smartlogix.chat.client;

import com.smartlogix.chat.exception.ChatUpstreamException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Cliente para la API gratuita de Groq (https://console.groq.com), compatible
 * con el formato de OpenAI Chat Completions. Se usa como placeholder/testing
 * para el asistente; no requiere tarjeta de credito, solo una API key gratis.
 */
@Component
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final int maxTokens;

    public GroqClient(
            RestClient restClient,
            @Value("${groq.api-key:}") String apiKey,
            @Value("${groq.model:llama-3.3-70b-versatile}") String model,
            @Value("${groq.base-url:https://api.groq.com/openai/v1}") String baseUrl,
            @Value("${groq.max-tokens:512}") int maxTokens) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
        this.maxTokens = maxTokens;
    }

    public String sendMessage(String systemPrompt, List<GroqRequest.GroqMessage> conversation) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("GROQ_API_KEY no esta configurada en chat-service");
            throw new ChatUpstreamException(
                    "El asistente no esta configurado todavia (falta la API key de Groq).");
        }

        List<GroqRequest.GroqMessage> messages = new ArrayList<>();
        messages.add(new GroqRequest.GroqMessage("system", systemPrompt));
        messages.addAll(conversation);

        GroqRequest requestBody = new GroqRequest(model, messages, maxTokens, 0.7);

        try {
            GroqResponse response = restClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("content-type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(GroqResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                throw new ChatUpstreamException("El asistente no genero ninguna respuesta.");
            }

            return response.choices().get(0).message().content();

        } catch (RestClientResponseException e) {
            log.error("Groq API respondio con error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ChatUpstreamException("El asistente no esta disponible en este momento. Intenta mas tarde.");
        } catch (Exception e) {
            log.error("Error inesperado llamando a la API de Groq", e);
            throw new ChatUpstreamException("El asistente no esta disponible en este momento. Intenta mas tarde.");
        }
    }
}
