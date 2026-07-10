package com.smartlogix.chat.exception;

/** Error al comunicarse con el proveedor de IA (Groq). */
public class ChatUpstreamException extends RuntimeException {
    public ChatUpstreamException(String message) {
        super(message);
    }
}
