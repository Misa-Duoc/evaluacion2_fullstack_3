import { useEffect, useState } from "react";
import { getShipment, getShipmentByTracking, updateShipmentStatus, getRewardCatalog } from "../service/shipmentService";
import { getSaveUser } from "../service/authService";
import { resolveDiscountsForShipments, getAppliedDiscounts } from "../utils/discountStorage";
import "../styles/components.css"

const SHIPMENT_STATUSES = ["PLANNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"]

// Porcentaje de descuento segun el tipo de canje (debe reflejar las reglas
// de RewardType.java en shipment-service).
const DISCOUNT_PERCENT_BY_REWARD = {
    DESCUENTO_20: 20,
    DESCUENTO_50: 50,
    ENVIO_GRATIS: 100
}

function formatCLP(value) {
    return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
}

// Genera un valor de envio pseudoaleatorio pero estable para cada
// trackingCode (entre $1.000 y $10.000), para no estar simulando montos
// distintos en cada renderizado.
function baseValueForTracking(trackingCode) {
    let hash = 0
    for (let i = 0; i < trackingCode.length; i++) {
        hash = (hash << 5) - hash + trackingCode.charCodeAt(i)
        hash |= 0
    }
    const positiveHash = Math.abs(hash)
    const value = 1000 + (positiveHash % 9001) // rango 1000 - 10000
    return Math.round(value / 10) * 10
}

// Calcula el "valor envio" de cada despacho y, si el correo del cliente
// tiene un descuento canjeado, lo aplica al envio que le corresponda
// (ver resolveDiscountsForShipments en discountStorage.js). El descuento
// queda fijo en ese trackingCode y se sigue mostrando en cada recarga.
//
// Blindaje: si el tipo de descuento no es uno de los conocidos (por
// ejemplo, datos viejos guardados en localStorage de una version
// anterior), se ignora por completo en vez de aplicar un porcentaje
// invalido. Ademas, el valor final nunca puede superar al valor base
// (un descuento jamas debe aumentar el precio).
function computeShipmentValues(shipments) {
    const discountsByTrackingCode = resolveDiscountsForShipments(shipments)
    const valuesMap = {}

    shipments.forEach((item) => {
        const base = baseValueForTracking(item.trackingCode)
        const descuento = discountsByTrackingCode[item.trackingCode]
        const percent = descuento ? DISCOUNT_PERCENT_BY_REWARD[descuento.rewardType] : undefined

        if (descuento && typeof percent === "number") {
            const final = Math.min(base, Math.max(0, Math.round(base * (1 - percent / 100))))
            valuesMap[item.trackingCode] = { base, final, descuentoAplicado: descuento }
        } else {
            if (descuento) {
                console.warn(`Descuento con rewardType desconocido para ${item.trackingCode}:`, descuento)
            }
            valuesMap[item.trackingCode] = { base, final: base, descuentoAplicado: null }
        }
    })

    return valuesMap
}

function ShipmentsPage() {

    const [shipments, setShipments]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");

    const [trackingSearch, setTrackingSearch] = useState("");
    const [searchResult, setSearchResult]     = useState(null);
    const [searchMessage, setSearchMessage]   = useState("");
    const [searchLoading, setSearchLoading]   = useState(false);
    const [statusMessage, setStatusMessage]   = useState("");
    const [minRewardCost, setMinRewardCost]   = useState(null);
    const [shipmentValues, setShipmentValues] = useState({});

    const user = getSaveUser();

    useEffect(() => {
        async function loadShipment() {
            setLoading(true); setError("");
            try {
                const response = await getShipment();
                setShipments(response);
                setShipmentValues(computeShipmentValues(response));
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        loadShipment();

        // Se carga el catalogo de canjes para saber, por correo, si ya
        // acumulo puntosDespacho suficientes para algun descuento.
        async function loadCatalog() {
            try {
                const catalog = await getRewardCatalog()
                if (catalog?.length > 0) {
                    setMinRewardCost(Math.min(...catalog.map((r) => r.costoEnPuntos)))
                }
            } catch {
                // Si falla la carga del catalogo, simplemente no se muestra el boton de canje.
            }
        }
        loadCatalog();
    }, []);

    async function handleSearch(event) {
        event.preventDefault(); setSearchMessage(""); setSearchResult(null); setSearchLoading(true);
        try {
            const result = await getShipmentByTracking(trackingSearch.trim())
            setSearchResult(result)
            // Si aun no se tiene calculado el valor de este envio, se calcula
            // ahora, revisando si ya tiene un descuento fijado a su trackingCode.
            setShipmentValues((prev) => {
                if (prev[result.trackingCode]) return prev
                const base = baseValueForTracking(result.trackingCode)
                const aplicados = getAppliedDiscounts()
                const descuento = Object.values(aplicados).find((d) => d.trackingCode === result.trackingCode)
                const percent = descuento ? DISCOUNT_PERCENT_BY_REWARD[descuento.rewardType] : undefined
                const esValido = descuento && typeof percent === "number"
                const final = esValido ? Math.min(base, Math.max(0, Math.round(base * (1 - percent / 100)))) : base
                return { ...prev, [result.trackingCode]: { base, final, descuentoAplicado: esValido ? descuento : null } }
            })
        } catch (error) {
            setSearchMessage(error.message)
        } finally {
            setSearchLoading(false)
        }
    }

    async function handleStatusChange(trackingCode, newStatus) {
        setStatusMessage("")
        try {
            const updated = await updateShipmentStatus(trackingCode, newStatus)
            setShipments((prev) => prev.map((s) => s.trackingCode === trackingCode ? updated : s))
            if (searchResult?.trackingCode === trackingCode) setSearchResult(updated)
            setStatusMessage("✓ Estado actualizado correctamente")
        } catch (error) {
            setStatusMessage(error.message)
        }
    }

    function statusBadge(status) {
        return <span className={`badge-status badge-${status}`}>{status}</span>
    }

    // Lleva al usuario a "Canje de ptos" dejando precargado el correo del
    // cliente Y el envio exacto desde el que se hizo clic, para que el
    // descuento se fije a ESA misma fila. Ademas deja una marca para que,
    // una vez canjeado, se vuelva automaticamente a "Envios" y se vea el
    // descuento aplicado al instante en ese envio.
    function goToRedeem(item) {
        localStorage.setItem("redeemPrefillEmail", item.customerEmail)
        localStorage.setItem("redeemPrefillTracking", item.trackingCode)
        localStorage.setItem("redeemReturnToShipment", "true")
        window.location.hash = "#/redeem"
    }

    function ShipmentRow({ item }) {
        const tieneDescuentoDisponible = minRewardCost !== null && item.puntosDespacho >= minRewardCost
        const valor = shipmentValues[item.trackingCode]
        return (
            <tr>
                <td><strong>{item.trackingCode}</strong></td>
                <td>{item.orderNumber}</td>
                <td style={{ fontSize: "0.78rem" }}>{item.customerEmail}</td>
                <td>{item.carrier}</td>
                <td>{item.routeCode}</td>
                <td style={{ fontSize: "0.78rem" }}>{item.estimatedDeliveryDate}</td>
                <td>{statusBadge(item.status)}</td>
                <td style={{ textAlign: "center" }}>⭐ {item.puntosDespacho}</td>
                <td style={{ textAlign: "center" }}>
                    {valor && valor.descuentoAplicado ? (
                        <div style={{ lineHeight: 1.3 }}>
                            <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "0.75rem" }}>
                                {formatCLP(valor.base)}
                            </span>
                            <br />
                            <strong style={{ color: "#15803d" }}>{formatCLP(valor.final)}</strong>
                            <br />
                            <span style={{ fontSize: "0.7rem", color: "#15803d" }}>
                                🏷️ {valor.descuentoAplicado.descripcion}
                            </span>
                        </div>
                    ) : (
                        valor ? formatCLP(valor.final) : "—"
                    )}
                </td>
                <td>
                    <select value={item.status} onChange={(e) => handleStatusChange(item.trackingCode, e.target.value)}>
                        {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </td>
                <td style={{ textAlign: "center" }}>
                    {tieneDescuentoDisponible && (
                        <button
                            className="btn-sl-primary"
                            type="button"
                            style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                            onClick={() => goToRedeem(item)}
                        >
                            🎁 Canjear
                        </button>
                    )}
                </td>
            </tr>
        )
    }

    const tableHeader = (
        <thead>
            <tr>
                <th>Tracking</th><th>N° Orden</th><th>Email cliente</th><th>Carrier</th>
                <th>Ruta</th><th>Entrega estimada</th><th>Estado</th><th>Puntos</th><th>Valor envío</th><th>Cambiar estado</th><th>Canjear</th>
            </tr>
        </thead>
    )

    return (
        <main>
            <div className="page-header">
                <h2>📦 Envíos</h2>
                {user && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{user.username} — {user.role}</span>}
            </div>

            <form className="search-bar" onSubmit={handleSearch}>
                <div>
                    <label className="form-label">Buscar por tracking</label>
                    <input
                        className="form-control"
                        value={trackingSearch}
                        onChange={(e) => setTrackingSearch(e.target.value)}
                        placeholder="Código de tracking"
                    />
                </div>
                <button className="btn-sl-primary" type="submit" disabled={searchLoading || !trackingSearch.trim()}>
                    {searchLoading ? "Buscando..." : "🔍 Buscar"}
                </button>
            </form>

            {searchMessage && <p className="state-msg error">{searchMessage}</p>}

            {searchResult && (
                <div className="mb-4">
                    <p className="search-result-label">Resultado de búsqueda</p>
                    <div className="content-card">
                        <table className="sl-table">
                            {tableHeader}
                            <tbody><ShipmentRow item={searchResult} /></tbody>
                        </table>
                    </div>
                </div>
            )}

            {statusMessage && <p className="state-msg success">{statusMessage}</p>}
            {loading && <p className="state-msg loading">Cargando envíos...</p>}
            {error   && <p className="state-msg error">{error}</p>}

            {!loading && !error && (
                <div className="content-card">
                    <table className="sl-table">
                        {tableHeader}
                        <tbody>
                            {shipments.map((item) => <ShipmentRow key={item.trackingCode} item={item} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default ShipmentsPage;
