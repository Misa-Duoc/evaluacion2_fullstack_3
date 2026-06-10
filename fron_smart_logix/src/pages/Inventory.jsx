import { useEffect, useState } from "react";
import { getInventory, createInventoryItem, reserveInventory, dispatchInventory } from "../service/inventoryService";
import "../styles/components.css"

const EMPTY_FORM = {
    sku: "", productName: "", warehouseCode: "",
    availableQuantity: "", reorderLevel: ""
}

function InventoryPage() {

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");

    const [showForm, setShowForm]       = useState(false);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [formMessage, setFormMessage] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState("");

    useEffect(() => {
        async function loadInventory() {
            setLoading(true); setError("");
            try {
                const response = await getInventory();
                setInventory(response);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        loadInventory()
    }, [])

    function handleFieldChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(event) {
        event.preventDefault(); setFormMessage(""); setFormLoading(true);
        try {
            const payload = {
                sku: form.sku, productName: form.productName,
                warehouseCode: form.warehouseCode,
                availableQuantity: Number(form.availableQuantity),
                reorderLevel: Number(form.reorderLevel)
            }
            const created = await createInventoryItem(payload)
            setInventory((prev) => [created, ...prev])
            setForm(EMPTY_FORM); setShowForm(false);
        } catch (error) {
            setFormMessage(error.message);
        } finally {
            setFormLoading(false);
        }
    }

    async function handleReserve(sku) {
        setActionMessage("")
        const quantityStr = prompt(`Cantidad a reservar para ${sku}:`)
        if (!quantityStr) return
        const quantity = Number(quantityStr)
        if (!quantity || quantity < 1) { setActionMessage("Cantidad inválida"); return }
        try {
            const updated = await reserveInventory(sku, quantity)
            setInventory((prev) => prev.map((item) => item.sku === sku ? updated : item))
            setActionMessage(`✓ Reserva de ${quantity} unidades de ${sku} exitosa`)
        } catch (error) {
            setActionMessage(error.message)
        }
    }

    async function handleDispatch(sku) {
        setActionMessage("")
        const quantityStr = prompt(`Cantidad a despachar para ${sku}:`)
        if (!quantityStr) return
        const quantity = Number(quantityStr)
        if (!quantity || quantity < 1) { setActionMessage("Cantidad inválida"); return }
        try {
            const updated = await dispatchInventory(sku, quantity)
            setInventory((prev) => prev.map((item) => item.sku === sku ? updated : item))
            setActionMessage(`✓ Despacho de ${quantity} unidades de ${sku} exitoso`)
        } catch (error) {
            setActionMessage(error.message)
        }
    }

    return (
        <main>
            <div className="page-header">
                <h2>🏭 Inventario</h2>
                <button
                    className={showForm ? "btn-sl-secondary" : "btn-sl-primary"}
                    type="button"
                    onClick={() => { setShowForm((v) => !v); setFormMessage("") }}
                >
                    {showForm ? "✕ Cancelar" : "+ Nuevo ítem"}
                </button>
            </div>

            {showForm && (
                <div className="form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label">SKU</label>
                                <input className="form-control" value={form.sku} onChange={(e) => handleFieldChange("sku", e.target.value)} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Nombre del producto</label>
                                <input className="form-control" value={form.productName} onChange={(e) => handleFieldChange("productName", e.target.value)} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Código de bodega</label>
                                <input className="form-control" value={form.warehouseCode} onChange={(e) => handleFieldChange("warehouseCode", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Cantidad disponible</label>
                                <input className="form-control" type="number" min="0" value={form.availableQuantity} onChange={(e) => handleFieldChange("availableQuantity", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Nivel de reorden</label>
                                <input className="form-control" type="number" min="0" value={form.reorderLevel} onChange={(e) => handleFieldChange("reorderLevel", e.target.value)} />
                            </div>
                        </div>

                        {formMessage && <p className="state-msg error mt-3">{formMessage}</p>}

                        <div className="d-flex gap-2 mt-3">
                            <button className="btn-sl-primary" type="submit" disabled={formLoading}>
                                {formLoading ? "Creando..." : "Crear ítem"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {actionMessage && <p className="state-msg success">{actionMessage}</p>}
            {loading && <p className="state-msg loading">Cargando inventario...</p>}
            {error   && <p className="state-msg error">{error}</p>}

            {!loading && !error && (
                <div className="content-card">
                    <table className="sl-table">
                        <thead>
                            <tr>
                                <th>SKU</th><th>Producto</th><th>Bodega</th>
                                <th>Disponible</th><th>Reservado</th><th>Reorden</th>
                                <th>Actualizado</th><th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item) => (
                                <tr key={item.sku}>
                                    <td><strong>{item.sku}</strong></td>
                                    <td>{item.productName}</td>
                                    <td>{item.warehouseCode}</td>
                                    <td>{item.availableQuantity}</td>
                                    <td>{item.reservedQuantity}</td>
                                    <td>{item.reorderLevel}</td>
                                    <td style={{ fontSize: "0.78rem", color: "#6b7280" }}>{item.updatedAt}</td>
                                    <td>
                                        <button className="btn-sl-sm" type="button" onClick={() => handleReserve(item.sku)}>Reservar</button>
                                        <button className="btn-sl-sm" type="button" onClick={() => handleDispatch(item.sku)}>Despachar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    )
}

export default InventoryPage
