// shared by Shipping, ConfirmOrder, Payment and OrderSuccess

export const GREEN = '#17332a'
export const GREEN_DARK = '#0f241d'
export const GOLD = '#c9a227'

export const peso = (value) =>
    `₱${Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`

// change these three to adjust the totals shown at checkout
export const SHIPPING_FEE = 50            // flat shipping fee
export const FREE_SHIPPING_OVER = 1000    // orders at or above this ship free
export const TAX_RATE = 0                 // prices already include VAT; set 0.12 to add 12% on top

export const calcTotals = (cartItems = []) => {
    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE
    const taxPrice = Number((itemsPrice * TAX_RATE).toFixed(2))
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2))

    return {
        itemsPrice: Number(itemsPrice.toFixed(2)),
        shippingPrice,
        taxPrice,
        totalPrice,
    }
}

// the order model requires an image on every item, so items without one get this
export const PLACEHOLDER_IMAGE = 'https://placehold.co/200x200?text=No+image'

// CARTIFY-12345678 when the order has an orderNumber, otherwise built from the id
export const formatOrderNumber = (order) => {
    if (!order) return ''
    if (order.orderNumber) return order.orderNumber
    return order._id ? `CARTIFY-${String(order._id).slice(-8).toUpperCase()}` : ''
}