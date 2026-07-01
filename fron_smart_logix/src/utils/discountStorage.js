const PENDING_KEY = "pendingDiscounts";  // email -> { rewardType, descripcion } (recien canjeado, sin envio asignado aun)
const APPLIED_KEY = "appliedDiscounts";  // email -> { trackingCode, rewardType, descripcion } (ya fijado a un envio)

function normalize(email) {
    return (email || "").trim().toLowerCase();
}

function readJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
        return {};
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getPendingDiscounts() {
    return readJson(PENDING_KEY);
}

export function savePendingDiscounts(pending) {
    writeJson(PENDING_KEY, pending);
}

export function getAppliedDiscounts() {
    return readJson(APPLIED_KEY);
}

export function saveAppliedDiscounts(applied) {
    writeJson(APPLIED_KEY, applied);
}

// Se llama justo despues de un canje exitoso (CanjePuntos.jsx): deja
// registrado que ese correo tiene un descuento recien canjeado, listo
// para fijarse a un envio la siguiente vez que se abra "Envios".
export function setPendingDiscount(email, reward) {
    const pending = getPendingDiscounts();
    pending[normalize(email)] = reward;
    savePendingDiscounts(pending);
}

// Fija un descuento recien canjeado DIRECTAMENTE al envio (trackingCode)
// exacto desde el que se presiono "Canjear". Asi, al volver a "Envios",
// el descuento se ve en ESA misma fila, sin ambiguedad (no se elige otro
// envio del mismo correo). Sobrescribe cualquier descuento previo de ese
// correo y limpia su pendiente para no duplicar.
export function setAppliedDiscountForTracking(email, trackingCode, reward) {
    const key = normalize(email);

    const applied = getAppliedDiscounts();
    applied[key] = { trackingCode, ...reward };
    saveAppliedDiscounts(applied);

    const pending = getPendingDiscounts();
    if (pending[key]) {
        delete pending[key];
        savePendingDiscounts(pending);
    }
}

// Toma los descuentos pendientes (recien canjeados) y los fija de forma
// PERMANENTE a un envio concreto de ese correo: se prefiere el envio mas
// reciente que aun no este DELIVERED; si todos ya se entregaron, se usa
// el ultimo de la lista. Una vez fijado, el descuento queda guardado en
// "appliedDiscounts" y se sigue mostrando en cada recarga (no desaparece).
// Devuelve un mapa trackingCode -> descuento, listo para usar en la tabla.
export function resolveDiscountsForShipments(shipments) {
    const pending = getPendingDiscounts();
    const applied = getAppliedDiscounts();

    const shipmentsByEmail = {};
    shipments.forEach((shipment) => {
        const key = normalize(shipment.customerEmail);
        if (!shipmentsByEmail[key]) shipmentsByEmail[key] = [];
        shipmentsByEmail[key].push(shipment);
    });

    let pendingChanged = false;

    Object.keys(pending).forEach((email) => {
        if (applied[email]) return; // ya tiene un envio asignado: se ignora el nuevo pendiente hasta que se use ese cupo

        const candidatos = shipmentsByEmail[email];
        if (!candidatos || candidatos.length === 0) return; // ese correo aun no tiene envios visibles en esta carga

        const activo = candidatos.find((s) => s.status !== "DELIVERED");
        const target = activo ?? candidatos[candidatos.length - 1];

        applied[email] = { trackingCode: target.trackingCode, ...pending[email] };
        delete pending[email];
        pendingChanged = true;
    });

    if (pendingChanged) {
        savePendingDiscounts(pending);
        saveAppliedDiscounts(applied);
    }

    const byTrackingCode = {};
    Object.values(applied).forEach((discount) => {
        byTrackingCode[discount.trackingCode] = discount;
    });
    return byTrackingCode;
}
