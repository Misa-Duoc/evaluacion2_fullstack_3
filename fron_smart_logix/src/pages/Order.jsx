import { useEffect, useState } from "react";
import { getOrders, createOrder } from "../service/orderService";
import "../styles/components.css"

const EMPTY_FORM = {
    customerName: "", customerEmail: "", shippingAddress: "",
    lines: [{ sku: "", quantity: 1, unitPrice: "" }]
}

function OrderPage() {

    const [order, setOrder]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");

    const [showForm, setShowForm]       = useState(false);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [formMessage, setFormMessage] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        async function loadOrder() {
            setLoading(true); setError("");
            try {
                const response = await getOrders();
                setOrder(response);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        loadOrder()
    }, [])

    function handleFieldChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    function handleLineChange(index, field, value) {
        setForm((prev) => {
            const lines = prev.lines.map((line, i) => i === index ? { ...line, [field]: value } : line)
            return { ...prev, lines }
        })
    }

    function addLine() {
        setForm((prev) => ({ ...prev, lines: [...prev.lines, { sku: "", quantity: 1, unitPrice: "" }] }))
    }

    function removeLine(index) {
        setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }))
    }

    async function handleSubmit(event) {
        event.preventDefault(); setFormMessage(""); setFormLoading(true);
        try {
            const payload = {
                customerName: form.customerName,
                customerEmail: form.customerEmail,
                shippingAddress: form.shippingAddress,
                lines: form.lines.map((line) => ({
                    sku: line.sku,
                    quantity: Number(line.quantity),
                    unitPrice: Number(line.unitPrice)
                }))
            }
            const created = await createOrder(payload)
            setOrder((prev) => [created, ...prev])
            setForm(EMPTY_FORM); setShowForm(false);
        } catch (error) {
            setFormMessage(error.message);
        } finally {
            setFormLoading(false);
        }
    }

    function statusBadge(status) {
        return <span className={`badge-status badge-${status}`}>{status}</span>
    }

    return (
        <main>
            <div className="page-header">
                <h2>🧾 Órdenes</h2>
                <button
                    className={showForm ? "btn-sl-secondary" : "btn-sl-primary"}
                    type="button"
                    onClick={() => { setShowForm((v) => !v); setFormMessage("") }}
                >
                    {showForm ? "✕ Cancelar" : "+ Nueva orden"}
                </button>
            </div>

            {showForm && (
                <div className="form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label">Nombre del cliente</label>
                                <input className="form-control" value={form.customerName} onChange={(e) => handleFieldChange("customerName", e.target.value)} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Email del cliente</label>
                                <input className="form-control" type="email" value={form.customerEmail} onChange={(e) => handleFieldChange("customerEmail", e.target.value)} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Dirección de envío</label>
                                <input className="form-control" value={form.shippingAddress} onChange={(e) => handleFieldChange("shippingAddress", e.target.value)} />
                            </div>
                        </div>

                        <p className="form-section-title">Líneas de orden</p>
                        {form.lines.map((line, index) => (
                            <div className="order-line-row" key={index}>
                                <input className="form-control" placeholder="SKU" value={line.sku} onChange={(e) => handleLineChange(index, "sku", e.target.value)} />
                                <input className="form-control" type="number" placeholder="Cantidad" min="1" value={line.quantity} onChange={(e) => handleLineChange(index, "quantity", e.target.value)} style={{ maxWidth: 110 }} />
                                <input className="form-control" type="number" placeholder="Precio unit." min="0.01" step="0.01" value={line.unitPrice} onChange={(e) => handleLineChange(index, "unitPrice", e.target.value)} style={{ maxWidth: 130 }} />
                                {form.lines.length > 1 && (
                                    <button className="btn-sl-sm" type="button" onClick={() => removeLine(index)}>✕</button>
                                )}
                            </div>
                        ))}

                        <button className="btn-sl-secondary" type="button" onClick={addLine} style={{ marginBottom: 12 }}>
                            + Agregar línea
                        </button>

                        {formMessage && <p className="state-msg error">{formMessage}</p>}

                        <div className="d-flex gap-2 mt-2">
                            <button className="btn-sl-primary" type="submit" disabled={formLoading}>
                                {formLoading ? "Creando..." : "Crear orden"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading && <p className="state-msg loading">Cargando órdenes...</p>}
            {error   && <p className="state-msg error">{error}</p>}

            {!loading && !error && (
                <div className="content-card">
                    <table className="sl-table">
                        <thead>
                            <tr>
                                <th>N° Orden</th><th>Estado</th><th>Total</th>
                                <th>Tracking</th><th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.map((item) => (
                                <tr key={item.orderNumber}>
                                    <td><strong>{item.orderNumber}</strong></td>
                                    <td>{statusBadge(item.status)}</td>
                                    <td>${item.totalAmount}</td>
                                    <td>{item.trackingCode ?? "—"}</td>
                                    <td style={{ fontSize: "0.78rem", color: "#6b7280" }}>{item.createdAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    )
}

export default OrderPage
