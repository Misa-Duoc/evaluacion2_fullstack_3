import { useEffect, useRef, useState } from "react"
import { sendChatMessage } from "../service/chatService"
import "../styles/chat.css"

const GREETING = "¡Hola! Soy el asistente de SmartLogix. ¿En qué te puedo ayudar?"
const BUBBLE_DELAY_MS = 2500

export default function ChatWidget() {
    const [open, setOpen] = useState(false)
    const [showBubble, setShowBubble] = useState(false)
    const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const listRef = useRef(null)

    // Muestra la burbuja de notificacion unos segundos despues de cargar,
    // como un típico bot de soporte. Se oculta si el usuario abre el chat.
    useEffect(() => {
        const timer = setTimeout(() => setShowBubble(true), BUBBLE_DELAY_MS)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages, sending])

    function handleOpen() {
        setOpen(true)
        setShowBubble(false)
    }

    async function handleSend(event) {
        event.preventDefault()
        const text = input.trim()
        if (!text || sending) return

        setError(null)
        const nextMessages = [...messages, { role: "user", content: text }]
        setMessages(nextMessages)
        setInput("")
        setSending(true)

        try {
            // Se envia el historial previo (sin el saludo inicial, que es solo de UI
            // y no forma parte de la conversacion real con el modelo).
            const history = messages.slice(1)

            const response = await sendChatMessage(text, history)
            setMessages((prev) => [...prev, { role: "assistant", content: response.reply }])
        } catch (err) {
            setError(err.message || "No se pudo contactar al asistente")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="chat-widget">
            {showBubble && !open && (
                <button
                    type="button"
                    className="chat-notification-bubble"
                    onClick={handleOpen}
                >
                    {GREETING}
                    <span
                        className="chat-notification-close"
                        role="button"
                        aria-label="Cerrar aviso"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowBubble(false)
                        }}
                    >
                        ×
                    </span>
                </button>
            )}

            {open && (
                <div className="chat-panel">
                    <div className="chat-panel-header">
                        <span>🤖 Asistente SmartLogix</span>
                        <button
                            type="button"
                            className="chat-panel-close"
                            aria-label="Cerrar chat"
                            onClick={() => setOpen(false)}
                        >
                            ×
                        </button>
                    </div>

                    <div className="chat-panel-messages" ref={listRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                                {m.content}
                            </div>
                        ))}
                        {sending && (
                            <div className="chat-bubble chat-bubble-assistant chat-bubble-typing">
                                Escribiendo…
                            </div>
                        )}
                    </div>

                    {error && <p className="chat-panel-error">{error}</p>}

                    <form className="chat-panel-input" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Escribe tu pregunta..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={sending}
                        />
                        <button type="submit" disabled={sending || !input.trim()}>
                            Enviar
                        </button>
                    </form>
                </div>
            )}

            {!open && (
                <button
                    type="button"
                    className="chat-fab"
                    aria-label="Abrir chat de ayuda"
                    onClick={handleOpen}
                >
                    💬
                </button>
            )}
        </div>
    )
}
