import { useEffect, useState } from "react";

import { getShipment } from "../service/shipmentService";
import { getSaveToken, getSaveUser } from "../service/authService";

function ShipmentsPage() {

    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = getSaveUser();

    useEffect(() => {

        async function loadShipment() {
            setLoading(true);
            setError("");

            try {
                const response = await getShipment();
                console.log(response);
                setShipments(response);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        }

        loadShipment();

    }, []);

    return (
        <main>
            <div>
                Header
            </div>
        </main>
    );
}

export default ShipmentsPage;