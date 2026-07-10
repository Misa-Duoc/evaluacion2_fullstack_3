package com.smartlogix.chat.service;

import com.smartlogix.chat.client.GroqClient;
import com.smartlogix.chat.client.GroqRequest.GroqMessage;
import com.smartlogix.chat.dto.ChatMessage;
import com.smartlogix.chat.dto.ChatRequest;
import com.smartlogix.chat.dto.ChatResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    // Cuantos turnos previos de la conversacion se reenvian como contexto.
    private static final int MAX_HISTORY_TURNS = 12;

    private final GroqClient groqClient;

    public ChatService(GroqClient groqClient) {
        this.groqClient = groqClient;
    }

    public ChatResponse chat(ChatRequest request, String username, String role) {
        String systemPrompt = buildSystemPrompt(username, role);
        List<GroqMessage> messages = buildMessages(request);

        String reply = groqClient.sendMessage(systemPrompt, messages);
        return new ChatResponse(reply.isBlank() ? "No tengo una respuesta para eso ahora mismo." : reply.trim());
    }

    private List<GroqMessage> buildMessages(ChatRequest request) {
        List<GroqMessage> messages = new ArrayList<>();

        if (request.history() != null) {
            List<ChatMessage> trimmedHistory = request.history().size() > MAX_HISTORY_TURNS
                    ? request.history().subList(request.history().size() - MAX_HISTORY_TURNS, request.history().size())
                    : request.history();

            for (ChatMessage turn : trimmedHistory) {
                messages.add(new GroqMessage(turn.role(), turn.content()));
            }
        }

        messages.add(new GroqMessage("user", request.message()));
        return messages;
    }

    private String buildSystemPrompt(String username, String role) {
        boolean isAdmin = "ROLE_ADMIN".equals(role);

        String sections = isAdmin
                ? """
                  - Envios: consultar por codigo de seguimiento, cambiar estado.
                  - Ordenes: crear y revisar ordenes.
                  - Inventario: stock y productos.
                  - Puntos de despacho y canje de puntos por descuentos.
                  - Cupones de descuento: registrar, aplicar y quitar."""
                : """
                  - Envios: puede consultar el estado de sus envios.
                  - Descuento: puede ingresar un cupon de descuento para su correo.""";

        return """
               Eres el asistente virtual de SmartLogix, una plataforma de logistica
               (gestion de envios, ordenes, inventario y puntos de despacho).

               Le hablas al usuario "%s", cuyo rol en el sistema es %s.
               Estas son las secciones a las que ese rol tiene acceso en la aplicacion:
               %s

               Responde siempre en español, de forma breve, clara y amable.
               Si te preguntan algo fuera del ambito de SmartLogix (logistica, envios,
               ordenes, inventario, puntos y descuentos), indica cortesmente que solo
               puedes ayudar con temas de la plataforma.
               No inventes datos concretos (numeros de seguimiento, stock, ordenes) que
               no te hayan sido entregados en la conversacion; en esos casos, orienta al
               usuario a la seccion correspondiente del menu para consultarlos.
               """.formatted(username, role, sections);
    }
}
