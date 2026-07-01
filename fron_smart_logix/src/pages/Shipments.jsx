import { useEffect, useState } from "react";
import { getShipment, getShipmentByTracking, updateShipmentStatus, getRewardCatalog } from "../service/shipmentService";
import { getSaveUser, isAdmin } from "../service/authService";
import "../styles/components.css"

const SHIPMENT_STATUSES = ["PLANNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"]

function formatCLP(value) {
    return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
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

    const user = getSaveUser();
    // El rol USER solo puede visualizar los envíos (sin cambiar estado ni canjear).
    const admin = isAdmin();

    useEffect(() => {
        async function loadShipment() {
            setLoading(true); setError("");
            try {
                // El valor del envio y cualquier descuento/cupon ya vienen
                // calculados desde el backend; el frontend solo los muestra.
                const response = await getShipment();
                setShipments(response);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        loadShipment();

        // El catálogo de canjes (endpoint solo-admin) únicamente se consulta si el
        // usuario es administrador; sirve para decidir si mostrar el botón "Canjear".
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
        if (admin) {
            loadCatalog();
        }
    }, [admin]);

    async function handleSearch(event) {
        event.preventDefault(); setSearchMessage(""); setSearchResult(null); setSearchLoading(true);
        try {
            const result = await getShipmentByTracking(trackingSearch.trim())
            setSearchResult(result)
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

    // Lleva al usuario a "Canje de ptos" dejando precargado el correo del cliente
    // Y el envio exacto desde el que se hizo clic, para que el descuento se fije
    // a ESA misma fila. Estas marcas son solo navegacion entre pantallas.
    function goToRedeem(item) {
        localStorage.setItem("redeemPrefillEmail", item.customerEmail)
        localStorage.setItem("redeemPrefillTracking", item.trackingCode)
        localStorage.setItem("redeemReturnToShipment", "true")
        window.location.hash = "#/redeem"
    }

    // Celda "Valor envío": muestra el valor final que entrega el backend y, si
    // hubo descuento (cupon o puntos), tacha el valor base.
    function valueCell(item) {
        const base = item.baseValue
        const final = item.finalValue
        const tieneDescuento = base != null && final != null && final < base
        const cuponAplicado = Boolean(item.appliedCouponCode)
        const descuentoAplicado = Boolean(item.appliedRewardType)

        if (final == null) return "—"

        if (cuponAplicado || (tieneDescuento && !descuentoAplicado)) {
            return (
                <div style={{ lineHeight: 1.3 }}>
                    <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "0.75rem" }}>
                        {formatCLP(base)}
                    </span>
                    <br />
                    <strong style={{ color: "#15803d" }}>{formatCLP(final)}</strong>
                </div>
            )
        }

        if (descuentoAplicado) {
            return (
                <div style={{ lineHeight: 1.3 }}>
                    <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "0.75rem" }}>
                        {formatCLP(base)}
                    </span>
                    <br />
                    <strong style={{ color: "#15803d" }}>{formatCLP(final)}</strong>
                    {item.discountDescription && (
                        <>
                            <br />
                            <span style={{ fontSize: "0.7rem", color: "#15803d" }}>
                                🏷️ {item.discountDescription}
                            </span>
                        </>
                    )}
                </div>
            )
        }

        return formatCLP(final)
    }

    // Celda "Descuento": muestra el cupon por codigo aplicado, si lo hay.
    function discountCell(item) {
        if (!item.appliedCouponCode) {
            return <span style={{ color: "#9ca3af" }}>—</span>
        }
        return (
            <div style={{ lineHeight: 1.35 }}>
                <span
                    className="badge-status"
                    style={{ background: "#dcfce7", color: "#15803d", display: "inline-block" }}
                    title={item.discountDescription ?? ""}
                >
                    🎟️ {item.appliedCouponCode}
                </span>
                <br />
                <span style={{ fontSize: "0.68rem", color: "#15803d", fontWeight: 600 }}>
                    ✓ Cupón utilizado
                </span>
            </div>
        )
    }

    function ShipmentRow({ item }) {
        const tieneDescuentoDisponible = minRewardCost !== null && item.puntosDespacho >= minRewardCost
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
                <td style={{ textAlign: "center" }}>{valueCell(item)}</td>
                <td style={{ textAlign: "center" }}>{discountCell(item)}</td>
                <td>
                    {admin ? (
                        <select value={item.status} onChange={(e) => handleStatusChange(item.trackingCode, e.target.value)}>
                            {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    ) : (
                        <span style={{ color: "#9ca3af", fontSize: "0.78rem" }}>Solo lectura</span>
                    )}
                </td>
                <td style={{ textAlign: "center" }}>
                    {admin && tieneDescuentoDisponible && (
                        <button
                            className="btn-sl-primary"
                            type="button"
                            style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                            onClick={() => goToRedeem(item)}
                        >
                            🎁 Canjear
                        </button>
                    )}
                    {!admin && <span style={{ color: "#9ca3af" }}>—</span>}
                </td>
            </tr>
        )
    }

    const tableHeader = (
        <thead>
            <tr>
                <th>Tracking</th><th>N° Orden</th><th>Email cliente</th><th>Carrier</th>
                <th>Ruta</th><th>Entrega estimada</th><th>Estado</th><th>Puntos</th><th>Valor envío</th><th>Descuento</th><th>Cambiar estado</th><th>Canjear</th>
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
