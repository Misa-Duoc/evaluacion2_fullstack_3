import { useState } from "react";
import { getDispatchPoints } from "../service/shipmentService";
import { getSaveUser } from "../service/authService";
import "../styles/components.css"

function DispatchPointsPage() {

    const [email, setEmail]           = useState("");
    const [result, setResult]         = useState(null);
    const [message, setMessage]       = useState("");
    const [loading, setLoading]       = useState(false);

    const user = getSaveUser();

    async function handleSearch(event) {
        event.preventDefault();
        setMessage(""); setResult(null); setLoading(true);
        try {
            const response = await getDispatchPoints(email)
            setResult(response)
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    function formatDate(value) {
        if (!value) return "—"
        return new Date(value).toLocaleString()
    }

    return (
        <main>
            <div className="page-header">
                <h2>⭐ Puntos de despacho</h2>
                {user && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{user.username} — {user.role}</span>}
            </div>

            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "-8px", marginBottom: "20px" }}>
                Desde el primer despacho que realiza un correo, sus <strong>puntosDespacho</strong> aumentan en +5.
                Cada despacho adicional de ese mismo correo vuelve a sumar +5 puntos.
            </p>

            <form className="search-bar" onSubmit={handleSearch}>
                <div>
                    <label className="form-label">Correo del cliente</label>
                    <input
                        className="form-control"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cliente@correo.com"
                        required
                    />
                </div>
                <button className="btn-sl-primary" type="submit" disabled={loading || !email.trim()}>
                    {loading ? "Consultando..." : "🔍 Consultar puntos"}
                </button>
            </form>

            {message && <p className="state-msg error">{message}</p>}

            {result && (
                <div className="content-card" style={{ padding: "28px 32px" }}>
                    <p className="search-result-label">Resultado de la consulta</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--sl-primary)" }}>
                            {result.puntosDespacho}
                        </span>
                        <span style={{ fontSize: "1rem", color: "#374151" }}>puntosDespacho acumulados</span>
                    </div>
                    <p style={{ color: "#111827", marginBottom: "4px" }}>📧 {result.email}</p>
                    <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>
                        📦 Total de despachos realizados: <strong>{result.totalDespachos}</strong>
                    </p>
                    <p style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                        Última actualización: {formatDate(result.updatedAt)}
                    </p>
                </div>
            )}
        </main>
    );
}

export default DispatchPointsPage;
