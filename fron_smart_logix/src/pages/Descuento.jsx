import { useEffect, useState } from "react";
import {
    getCouponCatalog,
    listCoupons,
    registerCoupon,
    removeCoupon,
    applyCoupon
} from "../service/shipmentService";
import { getSaveUser, isAdmin } from "../service/authService";
import "../styles/components.css"

function formatCLP(value) {
    return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
}

function DescuentoPage() {

    const [email, setEmail]             = useState("");
    const [couponCode, setCouponCode]   = useState("");
    const [message, setMessage]         = useState("");
    const [messageType, setMessageType] = useState("error");
    const [registered, setRegistered]   = useState([]);
    const [acceptingEmail, setAcceptingEmail] = useState(null);

    const [validCoupons, setValidCoupons]   = useState([]);
    const [shipmentValue, setShipmentValue] = useState(1000);

    const user  = getSaveUser();
    const admin = isAdmin();

    useEffect(() => {
        async function loadInitialData() {
            try {
                // El catálogo (códigos válidos) lo pueden ver ambos roles.
                const catalog = await getCouponCatalog()
                setValidCoupons(catalog.validCoupons ?? [])
                setShipmentValue(catalog.shipmentValue ?? 1000)

                // La lista completa de cupones es solo para el administrador
                // (es quien revisa y acepta los cupones ingresados).
                if (admin) {
                    setRegistered(await listCoupons())
                }
            } catch (error) {
                setMessage(error.message)
                setMessageType("error")
            }
        }
        loadInitialData()
    }, [admin])

    async function refreshList() {
        if (!admin) return
        try {
            setRegistered(await listCoupons())
        } catch (error) {
            setMessage(error.message)
            setMessageType("error")
        }
    }

    // Ingresar (registrar) un cupón. Disponible para USER y ADMIN.
    async function handleRegister(event) {
        event.preventDefault(); setMessage("");

        const cleanEmail = email.trim().toLowerCase()
        const code = couponCode.trim().toUpperCase()

        try {
            const result = await registerCoupon(cleanEmail, code)
            if (admin) {
                setMessage(`✓ Cupón "${result.coupon}" asociado al correo ${result.email}.`)
            } else {
                setMessage(`✓ Cupón "${result.coupon}" ingresado para ${result.email}. ` +
                    `Quedó pendiente de aprobación: un administrador debe aceptarlo para que se aplique el envío de ${formatCLP(shipmentValue)}.`)
            }
            setMessageType("success")
            setEmail(""); setCouponCode("")
            await refreshList()
        } catch (error) {
            setMessage(error.message)
            setMessageType("error")
        }
    }

    // Aceptar (aplicar) un cupón. SOLO ADMIN.
    async function handleAccept(targetEmail) {
        setMessage(""); setAcceptingEmail(targetEmail);
        try {
            const res = await applyCoupon(targetEmail)
            if (res.status === "applied") {
                setMessage(`✓ Cupón ${res.coupon} de ${targetEmail} aceptado. ` +
                    `El envío ${res.appliedTrackingCode} quedó en ${formatCLP(res.valorEnvioFinal ?? shipmentValue)}.`)
                setMessageType("success")
            } else if (res.status === "already_used") {
                setMessage(`El cupón de ${targetEmail} ya había sido aceptado.`)
                setMessageType("info")
            } else {
                setMessage(res.mensaje || `El correo ${targetEmail} aún no tiene un envío al que aplicar el cupón.`)
                setMessageType("error")
            }
            await refreshList()
        } catch (error) {
            setMessage(error.message)
            setMessageType("error")
        } finally {
            setAcceptingEmail(null)
        }
    }

    async function handleRemove(targetEmail) {
        try {
            await removeCoupon(targetEmail)
            setMessage(`Se quitó el descuento del correo ${targetEmail}.`)
            setMessageType("info")
            await refreshList()
        } catch (error) {
            setMessage(error.message)
            setMessageType("error")
        }
    }

    function statusBadge(status) {
        const isApplied = status === "aplicado"
        return (
            <span className="badge-status"
                style={{ background: isApplied ? "#dcfce7" : "#fef9c3", color: isApplied ? "#15803d" : "#92400e" }}>
                {isApplied ? "✓ Aceptado" : "Pendiente"}
            </span>
        )
    }

    return (
        <main>
            <div className="page-header">
                <h2>🏷️ Descuento</h2>
                {user && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{user.username} — {user.role}</span>}
            </div>

            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "-8px", marginBottom: "20px" }}>
                {admin
                    ? <>Revisa los cupones ingresados por los clientes y <strong>acéptalos</strong> para aplicar el envío de <strong>{formatCLP(shipmentValue)}</strong>. Cupones válidos: <strong>{validCoupons.join(", ")}</strong>.</>
                    : <>Ingresa tu <strong>cupón de descuento</strong>. Quedará <strong>pendiente</strong> hasta que un administrador lo acepte. Cupones válidos: <strong>{validCoupons.join(", ")}</strong>.</>}
            </p>

            <div className="form-card">
                <form onSubmit={handleRegister}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Correo del cliente</label>
                            <input className="form-control" type="email" value={email}
                                onChange={(e) => { setEmail(e.target.value); setMessage("") }}
                                placeholder="cliente@correo.com" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Cupón de descuento</label>
                            <input className="form-control" value={couponCode}
                                onChange={(e) => { setCouponCode(e.target.value); setMessage("") }}
                                placeholder={validCoupons.join(", ")} style={{ textTransform: "uppercase" }} />
                        </div>
                    </div>

                    {message && <p className={`state-msg ${messageType}`} style={{ marginTop: 16 }}>{message}</p>}

                    <div className="d-flex gap-2 mt-2">
                        <button className="btn-sl-primary" type="submit">
                            {admin ? "Asociar cupón" : "Ingresar cupón"}
                        </button>
                    </div>
                </form>
            </div>

            {/* La lista y la aceptación de cupones son exclusivas del administrador. */}
            {admin && (
                <>
                    <p className="search-result-label" style={{ marginTop: 24 }}>Cupones ingresados</p>
                    <div className="content-card">
                        {registered.length === 0 ? (
                            <p className="state-msg loading" style={{ margin: 16 }}>
                                Aún no hay cupones ingresados por los clientes.
                            </p>
                        ) : (
                            <table className="sl-table">
                                <thead>
                                    <tr>
                                        <th>Correo</th><th>Cupón</th><th>Valor envío</th><th>Estado</th><th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registered.map((item) => (
                                        <tr key={item.email}>
                                            <td style={{ fontSize: "0.85rem" }}>{item.email}</td>
                                            <td>
                                                <span className="badge-status" style={{ background: "#dcfce7", color: "#15803d" }}>
                                                    🎟️ {item.coupon}
                                                </span>
                                            </td>
                                            <td><strong style={{ color: "#15803d" }}>{formatCLP(shipmentValue)}</strong></td>
                                            <td>{statusBadge(item.status)}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    {item.status !== "aplicado" && (
                                                        <button className="btn-sl-primary" type="button"
                                                            style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                                                            disabled={acceptingEmail === item.email}
                                                            onClick={() => handleAccept(item.email)}
                                                            title="Aceptar y aplicar el cupón">
                                                            {acceptingEmail === item.email ? "Aceptando..." : "✓ Aceptar"}
                                                        </button>
                                                    )}
                                                    <button className="btn-sl-sm" type="button"
                                                        onClick={() => handleRemove(item.email)} title="Quitar cupón">
                                                        ✕ Quitar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </main>
    );
}

export default DescuentoPage;
