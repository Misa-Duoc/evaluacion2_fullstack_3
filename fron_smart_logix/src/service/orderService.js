import { getOrdersRequest, createOrderRequest, getOrderByNumberRequest } from "../api/orderApi"
import { getRequiredAuthorizationHeader } from "./authService"

export async function getOrders() {
    // El service valida sesion antes de pedir datos al backend.
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getOrdersRequest(authorizationHeader)
}

export async function createOrder(orderData) {
    const authorizationHeader = getRequiredAuthorizationHeader()

    if (!orderData.customerName?.trim()) {
        throw new Error("El nombre del cliente es obligatorio")
    }
    if (!orderData.customerEmail?.trim()) {
        throw new Error("El email del cliente es obligatorio")
    }
    if (!orderData.shippingAddress?.trim()) {
        throw new Error("La dirección de envío es obligatoria")
    }
    if (!orderData.lines?.length) {
        throw new Error("La orden debe tener al menos una línea")
    }

    return createOrderRequest(authorizationHeader, orderData)
}

export async function getOrderByNumber(orderNumber) {
    const authorizationHeader = getRequiredAuthorizationHeader()
    return getOrderByNumberRequest(authorizationHeader, orderNumber)
}
