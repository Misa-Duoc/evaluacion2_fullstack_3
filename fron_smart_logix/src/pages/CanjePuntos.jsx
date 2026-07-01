import { useEffect, useState } from "react";
import { getRewardCatalog, redeemPoints, getDispatchPoints } from "../service/shipmentService";
import { setPendingDiscount, setAppliedDiscountForTracking } from "../utils/discountStorage";
import { getSaveUser } from "../service/authService";
import "../styles/components.css"

const REWARD_ICONS = {
    DESCUENTO_20: "🏷️",
    DESCUENTO_50: "🔥",
    ENVIO_GRATIS: "🚚"
}

function CanjePuntosPage() {

    const [email, setEmail]             = useState("");
    const [targetTracking, setTargetTracking] = useState(null);
    const [catalog, setCatalog]         = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [redeemingType, setRedeemingType]   = useState(null);
    const [message, setMessage]         = useState("");
    const [messageType, setMessageType] = useState("error");
    const [lastResult, setLastResult]   = useState(null);

    const [points, setPoints]                       = useState(null);
    const [checkingPoints, setCheckingPoints]        = useState(false);
    const [availabilityMessage, setAvailabilityMessage] = useState("");

    const user = getSaveUser();

    useEffect(() => {
        async function loadCatalog() {
            try {
                const response = await getRewardCatalog()
                setCatalog(response)

                // Si se llego desde "Envios" con un correo precargado
                // (boton "Canjear"), se completa el campo y se consulta
                // de inmediato que opciones tiene disponibles.
                const prefillEmail = localStorage.getItem("redeemPrefillEmail")
                const prefillTracking = localStorage.getItem("redeemPrefillTracking")
                if (prefillEmail) {
                    localStorage.removeItem("redeemPrefillEmail")
                    localStorage.removeItem("redeemPrefillTracking")
                    setEmail(prefillEmail)
                    if (prefillTracking) setTargetTracking(prefillTracking)
                    checkPointsAvailability(prefillEmail, response)
                } else {
                    // Navegación manual a "Canje de ptos" (no se llegó desde el
                    // botón "Canjear" de un envío): no se debe redirigir ni fijar
                    // a un envío concreto, así que se limpian las marcas viejas.
                    localStorage.removeItem("redeemReturnToShipment")
                    localStorage.removeItem("redeemPrefillTracking")
                }
            } catch (error) {
                setMessage(error.message)
                setMessageType("error")
            } finally {
                setLoadingCatalog(false)
            }
        }
        loadCatalog()
    }, [])

    // Arma el mensaje informativo de canjes disponibles segun los puntosDespacho
    // que tiene acumulados el correo consultado.
    function buildAvailabilityMessage(puntosDespacho, catalogList) {
        if (!catalogList || catalogList.length === 0) return "";

        const disponibles = catalogList.filter((r) => r.costoEnPuntos <= puntosDespacho);
        const noDisponibles = catalogList
            .filter((r) => r.costoEnPuntos > puntosDespacho)
            .sort((a, b) => a.costoEnPuntos - b.costoEnPuntos);

        if (disponibles.length === 0) {
            const proximo = noDisponibles[0];
            const faltan = proximo ? proximo.costoEnPuntos - puntosDespacho : 0;
            return proximo
                ? `Con ${puntosDespacho} pts aun no puedes canjear ningun premio. Te faltan ${faltan} pts para "${proximo.descripcion}".`
                : `Con ${puntosDespacho} pts aun no puedes canjear ningun premio.`;
        }

        const nombresDisponibles = disponibles.map((r) => r.descripcion).join(", ");
        let texto = `Con ${puntosDespacho} pts disponibles, puedes canjear: ${nombresDisponibles}.`;

        if (noDisponibles.length > 0) {
            const proximo = noDisponibles[0];
            const faltan = proximo.costoEnPuntos - puntosDespacho;
            texto += ` Te faltan ${faltan} pts para "${proximo.descripcion}".`;
        }

        return texto;
    }

    async function checkPointsAvailability(targetEmail, catalogList = catalog) {
        const cleanEmail = targetEmail.trim();
        if (!cleanEmail || !catalogList || catalogList.length === 0) {
            setPoints(null);
            setAvailabilityMessage("");
            return;
        }

        setCheckingPoints(true);
        try {
            const response = await getDispatchPoints(cleanEmail);
            setPoints(response);
            setAvailabilityMessage(buildAvailabilityMessage(response.puntosDespacho, catalogList));
        } catch (error) {
            // Si el correo aun no tiene puntosDespacho registrados, se informa
            // que parte desde 0 y por lo tanto no tiene canjes disponibles aun.
            setPoints({ puntosDespacho: 0, totalDespachos: 0 });
            setAvailabilityMessage(buildAvailabilityMessage(0, catalogList));
        } finally {
            setCheckingPoints(false);
        }
    }

    async function handleRedeem(rewardType) {
        setMessage(""); setLastResult(null); setRedeemingType(rewardType);
        try {
            const response = await redeemPoints(email, rewardType)
            setLastResult(response)
            setMessage(response.mensaje)
            setMessageType("success")

            // Si se llego aqui desde el boton "Canjear" de un envio especifico,
            // el descuento se fija DIRECTAMENTE a ese envio (su trackingCode),
            // para que al volver a "Envios" se vea en esa misma fila. Si se llego
            // de forma manual, queda como pendiente del proximo envio del correo.
            if (targetTracking) {
                setAppliedDiscountForTracking(email, targetTracking, { rewardType: response.rewardType, descripcion: response.descripcion })
            } else {
                setPendingDiscount(email, { rewardType: response.rewardType, descripcion: response.descripcion })
            }

            // Si se llego aqui desde el boton "Canjear" de un envio especifico,
            // tras canjear se vuelve automaticamente a la pagina de "Envios"
            // para ver el descuento ya aplicado de manera inmediata.
            const volverAEnvios = localStorage.getItem("redeemReturnToShipment") === "true"
            if (volverAEnvios) {
                localStorage.removeItem("redeemReturnToShipment")
                setMessage("✓ Canje realizado. Redirigiendo a Envíos para ver el descuento aplicado...")
                setMessageType("success")
                setTimeout(() => { window.location.hash = "#/shipment" }, 1200)
                return
            }

            setMessage(response.mensaje)
            setMessageType("success")

            // Tras canjear, el saldo de puntos cambia: se recalcula el
            // mensaje de opciones disponibles con el nuevo saldo.
            setPoints({ puntosDespacho: response.puntosRestantes, totalDespachos: points?.totalDespachos ?? 0 })
            setAvailabilityMessage(buildAvailabilityMessage(response.puntosRestantes, catalog))
        } catch (error) {
            setMessage(error.message)
            setMessageType("error")
        } finally {
            setRedeemingType(null)
        }
    }

    return (
        <main>
            <div className="page-header">
                <h2>🎁 Canje de ptos</h2>
                {user && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{user.username} — {user.role}</span>}
            </div>

            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "-8px", marginBottom: "20px" }}>
                Cambia los <strong>puntosDespacho</strong> acumulados por un correo por descuentos de envio.
                Desde el primer despacho que realiza un correo ya se generan puntos.
            </p>

            <form className="search-bar" onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label className="form-label">Correo del cliente</label>
                    <input
                        className="form-control"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setMessage(""); setLastResult(null)
                            setPoints(null); setAvailabilityMessage("")
                        }}
                        onBlur={(e) => checkPointsAvailability(e.target.value)}
                        placeholder="cliente@correo.com"
                        required
                    />
                </div>
            </form>

            {checkingPoints && <p className="state-msg loading">Consultando puntosDespacho del correo...</p>}

            {!checkingPoints && availabilityMessage && (
                <p className={`state-msg ${points && catalog.some((r) => r.costoEnPuntos <= points.puntosDespacho) ? "info" : "error"}`}>
                    {availabilityMessage}
                </p>
            )}

            {message && <p className={`state-msg ${messageType}`}>{message}</p>}

            {lastResult && (
                <div className="content-card" style={{ padding: "20px 32px" }}>
                    <p className="search-result-label">Detalle del canje</p>
                    <p style={{ color: "#111827", marginBottom: "4px" }}>📧 {lastResult.email}</p>
                    <p style={{ color: "#111827", marginBottom: "4px" }}>🎁 {lastResult.descripcion}</p>
                    <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                        Puntos usados: <strong>{lastResult.puntosUsados}</strong> · Puntos restantes: <strong>{lastResult.puntosRestantes}</strong>
                    </p>
                </div>
            )}

            {loadingCatalog ? (
                <p className="state-msg loading">Cargando catalogo de canjes...</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    {catalog.map((reward) => {
                        const noAlcanzaPuntos = points !== null && reward.costoEnPuntos > points.puntosDespacho
                        return (
                            <div
                                key={reward.rewardType}
                                className="content-card"
                                style={{ padding: "24px", textAlign: "center", opacity: noAlcanzaPuntos ? 0.5 : 1 }}
                            >
                                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                                    {REWARD_ICONS[reward.rewardType] ?? "🎟️"}
                                </div>
                                <p style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                                    {reward.descripcion}
                                </p>
                                <p style={{ color: "var(--sl-primary)", fontWeight: 700, marginBottom: "16px" }}>
                                    {reward.costoEnPuntos} pts
                                </p>
                                <button
                                    className="btn-sl-primary"
                                    type="button"
                                    disabled={redeemingType !== null || !email.trim() || noAlcanzaPuntos}
                                    onClick={() => handleRedeem(reward.rewardType)}
                                >
                                    {redeemingType === reward.rewardType
                                        ? "Canjeando..."
                                        : noAlcanzaPuntos
                                            ? "Puntos insuficientes"
                                            : "Canjear"}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </main>
    );
}

export default CanjePuntosPage;
