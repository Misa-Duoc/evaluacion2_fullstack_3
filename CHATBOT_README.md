# Asistente de IA (chat-service) — SmartLogix

Se agregó un nuevo microservicio, **chat-service**, que expone un asistente
conversacional real conectado a la API gratuita de **Groq** (formato
compatible con OpenAI Chat Completions), ideal para testing o como
placeholder ya que no requiere tarjeta de crédito. En el frontend
aparece como una burbuja flotante ("💬") que, unos segundos después de
cargar la app, muestra el mensaje "¿En qué te puedo ayudar?", igual que los
widgets de soporte típicos. Solo es visible cuando hay sesión iniciada.

## Qué se agregó

**Backend**
- `SmartLogix/chat-service/` — nuevo microservicio Spring Boot (puerto 8085).
  - `POST /api/chat` — recibe `{ message, history }` y responde `{ reply }`.
  - Valida el JWT igual que los demás servicios (mismo `JWT_SECRET`).
  - Cualquier usuario autenticado (`ROLE_USER` o `ROLE_ADMIN`) puede usarlo;
    el "system prompt" que se le da al modelo cambia según el rol, para que
    el asistente solo hable de las secciones que ese usuario puede ver.
  - Se registró en `pom.xml` (módulo padre), en el `api-gateway`
    (ruta `/api/chat/**`) y en `docker-compose.yml`.

**Frontend**
- `src/api/chatApi.js` y `src/service/chatService.js` — siguen el mismo
  patrón que ya usa el proyecto (`httpRequest`, `getRequiredAuthorizationHeader`).
- `src/components/ChatWidget.jsx` + `src/styles/chat.css` — el widget
  flotante con la burbuja de notificación y el panel de chat.
- Se agregó `<ChatWidget />` en `App.jsx`, dentro de la vista privada.

## Cómo configurar la API key (obligatorio, gratis)

El chat-service necesita una API key de **Groq**. Es gratuita, no pide
tarjeta de crédito y toma menos de 2 minutos conseguirla:

1. Entra a https://console.groq.com y crea una cuenta (puedes usar tu
   cuenta de Google).
2. Ve a **API Keys** (https://console.groq.com/keys) y crea una nueva key.
   Empieza con `gsk_...`.
3. **Nunca la pongas directamente en el código ni en el `docker-compose.yml`.**
   Se pasa como variable de entorno:

```bash
export GROQ_API_KEY="gsk_..."
```

o crea un archivo `.env` junto al `docker-compose.yml` (en `SmartLogix/`) con:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

Si no defines la key, el servicio arranca igual, pero el endpoint `/api/chat`
responderá con un error 503 controlado ("El asistente no está configurado
todavía") en vez de romper el resto de la app.

Otras variables opcionales (con sus valores por defecto):

```
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MAX_TOKENS=512
```

## Cómo levantarlo

```bash
cd SmartLogix
docker compose up --build
```

Esto reconstruye todos los servicios, incluido `chat-service`, y el
`api-gateway` esperará a que esté saludable (`/actuator/health`) antes de
levantarse, igual que con los demás microservicios.

## Notas de diseño

- El chat-service **no guarda historial en base de datos**: el frontend
  mantiene la conversación en memoria (estado de React) y la reenvía
  completa en cada request, igual que se hace directamente contra la API
  de Anthropic. Si refrescas la página, el historial del chat se reinicia
  (no así la sesión de login).
- El modelo por defecto es `llama-3.3-70b-versatile` (gratis en Groq); se
  puede cambiar con la variable de entorno `GROQ_MODEL` por cualquier otro
  modelo disponible en Groq (ej. `llama-3.1-8b-instant`, más rápido y liviano).
- El asistente tiene instrucciones para responder solo sobre temas de
  SmartLogix y para no inventar datos concretos (números de seguimiento,
  stock, etc.) que no se le hayan dado en la conversación.

## Posibles siguientes pasos (no incluidos)

- Dar al asistente acceso real a datos (ej. que pueda consultar el estado
  de un envío por su cuenta) integrando llamadas a `shipment-service` /
  `order-service` como "tools" de la API de Anthropic.
- Persistir el historial de conversación por usuario si se quiere que
  sobreviva a un refresh.
