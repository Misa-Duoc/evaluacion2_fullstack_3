import { useEffect, useState } from "react";
import { getOrders, createOrder } from "../service/orderService";
import { getCouponUsage, applyCoupon } from "../service/shipmentService";
import "../styles/components.css"

const EMPTY_FORM = {
    customerName: "", customerEmail: "", shippingAddress: "",
    lines: [{ sku: "", quantity: 1, unitPrice: "" }]
}

// Estado de cupon "vacio" para un correo sin consultar todavia.
const NO_COUPON = { state: "none", coupon: null, descripcion: null }

function OrderPage() {

    const [order, setOrder]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");

    const [showForm, setShowForm]       = useState(false);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [formMessage, setFormMessage] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    // Estado de uso del cupon del correo, consultado al backend (ya no a
    // localStorage). { state: "none" | "available" | "used", coupon, descripcion }
    const [couponUsage, setCouponUsage] = useState(NO_COUPON);

    // Decide si el cupon de descuento del correo se aplica o no a esta orden.
    // Si queda en false (no se presiona el boton), el envio mantiene su valor
    // normal aunque el correo tenga un cupon disponible.
    const [applyCouponFlag, setApplyCouponFlag] = useState(false);

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

    // Consulta al backend el estado del cupon del correo (al salir del campo).
    async function refreshCouponUsage(emailValue) {
        const clean = (emailValue ?? "").trim().toLowerCase()
        if (!clean) {
            setCouponUsage(NO_COUPON)
            setApplyCouponFlag(false)
            return
        }
        try {
            const usage = await getCouponUsage(clean)
            setCouponUsage(usage)
            if (usage.state === "used") setApplyCouponFlag(false)
        } catch {
            setCouponUsage(NO_COUPON)
        }
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

            // El descuento solo se aplica si el usuario presiono "Aplicar cupon".
            // La validacion (codigo valido, cupon unico por correo, valor del
            // envio) la resuelve el backend; aqui solo se decide aplicarlo o no
            // y se informa el resultado al usuario.
            const correo = form.customerEmail.trim().toLowerCase()

            if (applyCouponFlag) {
                const res = await applyCoupon(correo, created.trackingCode)
                if (res.status === "applied") {
                    window.alert(
                        `🏷️ Cupón de descuento aplicado.\n\n` +
                        `El correo ${correo} cuenta con el cupón ${res.coupon}.\n` +
                        `Su envío tendrá un valor de $1.000.\n\n` +
                        `Podrás ver el cupón aplicado en la ventana de Envíos.`
                    )
                } else if (res.status === "already_used") {
                    window.alert(
                        `🚫 El correo ${correo} ya utilizó su cupón ${res.coupon}.\n\n` +
                        `El cupón es único por correo, así que no puede volver a aplicarse.\n` +
                        `Esta orden se creó con el valor de envío normal.`
                    )
                } else {
                    window.alert(
                        `ℹ️ El correo ${correo} no tiene un cupón de descuento disponible para aplicar.\n\n` +
                        `La orden se creó con el valor de envío normal.\n` +
                        `Puedes asociarle un cupón en la sección "Descuento".`
                    )
                }
            } else if (couponUsage.state === "used") {
                window.alert(
                    `🚫 El correo ${correo} ya utilizó su cupón de descuento (es único por correo).\n\n` +
                    `El envío de esta orden tendrá su valor normal.`
                )
            } else if (couponUsage.state === "available") {
                window.alert(
                    `ℹ️ El correo ${correo} tiene el cupón ${couponUsage.coupon} disponible, ` +
                    `pero no se aplicó.\n\nEl envío mantendrá su valor normal.`
                )
            }

            setOrder((prev) => [created, ...prev])
            setForm(EMPTY_FORM); setApplyCouponFlag(false); setShowForm(false);
            setCouponUsage(NO_COUPON);
        } catch (error) {
            setFormMessage(error.message);
        } finally {
            setFormLoading(false);
        }
    }

    function statusBadge(status) {
        return <span className={`badge-status badge-${status}`}>{status}</span>
    }

    const emailIngresado = form.customerEmail.trim()
    const yaUsado = couponUsage.state === "used"
    const cuponDisponible = couponUsage.state === "available"

    return (
        <main>
            <div className="page-header">
                <h2>🧾 Órdenes</h2>
                <button
                    className={showForm ? "btn-sl-secondary" : "btn-sl-primary"}
                    type="button"
                    onClick={() => { setShowForm((v) => !v); setFormMessage(""); setApplyCouponFlag(false); setCouponUsage(NO_COUPON) }}
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
                                <input
                                    className="form-control"
                                    type="email"
                                    value={form.customerEmail}
                                    onChange={(e) => handleFieldChange("customerEmail", e.target.value)}
                                    onBlur={(e) => refreshCouponUsage(e.target.value)}
                                />
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

                        <div className="coupon-apply-box">
                            <button
                                type="button"
                                className={applyCouponFlag && !yaUsado ? "btn-sl-primary" : "btn-sl-secondary"}
                                onClick={() => setApplyCouponFlag((v) => !v)}
                                disabled={yaUsado}
                            >
                                {yaUsado
                                    ? "🚫 Cupón ya utilizado"
                                    : applyCouponFlag
                                        ? "✓ Cupón se aplicará"
                                        : "🏷️ Aplicar cupón"}
                            </button>
                            <span className="coupon-apply-hint">
                                {!emailIngresado
                                    ? "Ingresa el correo del cliente para ver si tiene un cupón disponible."
                                    : yaUsado
                                        ? `Este correo ya utilizó su cupón ${couponUsage.coupon ?? ""} (único por correo). No puede volver a usarlo.`
                                        : cuponDisponible
                                            ? (applyCouponFlag
                                                ? `Se aplicará el cupón ${couponUsage.coupon}: envío $1.000.`
                                                : `Este correo tiene el cupón ${couponUsage.coupon} disponible. Si no aplicas, el envío tendrá valor normal.`)
                                            : "Este correo no tiene un cupón asociado (sección \"Descuento\"). El envío tendrá valor normal."}
                            </span>
                        </div>

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
