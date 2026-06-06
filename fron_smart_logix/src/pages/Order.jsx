import { useEffect, useState } from "react";

import { getOrders } from "../service/orderService";

function OrderPage(){

    const [order, setOrder] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadOrder() {
            setLoading(true);
            setError("");
            try {
                const response = await getOrders();
                console.log(response);
                setOrder(response);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        }
        loadOrder()
    }, [])
}

export default OrderPage