import { useEffect, useState } from "react";
import { getShipment, getShipmentByTracking, updateShipmentStatus } from "../service/shipmentService";
import { getSaveUser } from "../service/authService";
import "../styles/components.css"

const SHIPMENT_STATUSES = ["PLANNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"]

function ShipmentsPage() {

    const [shipments, setShipments]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");

    const [trackingSearch, setTrackingSearch] = useState("");
    const [searchResult, setSearchResult]     = useState(null);
    const [searchMessage, setSearchMessage]   = useState("");
    const [searchLoading, setSearchLoading]   = useState(false);
    const [statusMessage, setStatusMessage]   = useState("");

    const user = getSaveUser();

    useEffect(() => {
        async function loadShipment() {
            setLoading(true); setError("");
            try {
                const response = await getShipment();
                setShipments(response);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        loadShipment();
    }, []);

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

    function ShipmentRow({ item }) {
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
                <td>
                    <select value={item.status} onChange={(e) => handleStatusChange(item.trackingCode, e.target.value)}>
                        {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </td>
            </tr>
        )
    }

    const tableHeader = (
        <thead>
            <tr>
                <th>Tracking</th><th>N° Orden</th><th>Email cliente</th><th>Carrier</th>
                <th>Ruta</th><th>Entrega estimada</th><th>Estado</th><th>Puntos</th><th>Cambiar estado</th>
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
