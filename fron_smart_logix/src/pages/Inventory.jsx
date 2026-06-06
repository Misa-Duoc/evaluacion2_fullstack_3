import { useEffect, useState } from "react";

import { getInventory } from "../service/inventoryService";

function InventoryPage(){

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadInventory() {
            setLoading(true);
            setError("");
            try {
                const response = await getInventory();
                console.log(response);
                setInventory(response);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        }
        loadInventory()
    }, [])

return (
    <main>
        <section>
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Producto</th>
                            <th>Bodega</th>
                            <th>Cantidad</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => (
                            <tr key={item.sku}>
                                <td>{item.sku}</td>
                                <td>{item.productName}</td>
                                <td>{item.warehouseCode}</td>
                                <td>{item.availableQuantity}</td>
                                <td>{item.updatedAt}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
        </section>
    </main>
)

}

export default InventoryPage