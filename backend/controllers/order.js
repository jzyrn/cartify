const Order = require('../models/order')
const Product = require('../models/product')
const sendEmail = require('../utils/sendEmail')
const createOrderReceipt = require('../utils/orderReceipt')

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]))

const peso = value => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const emailHtml = html => html.replace(/<img src="cid:cartify-logo"[^>]*>/g, '<span style="color:#fff;font-size:24px;font-weight:bold;letter-spacing:1px">Cartify</span>')
const customerStatus = status => status === 'Processing' || status === 'Preparing' ? 'Being processed' : status
const deliveryHeading = status => ({
    Pending: 'DELIVERY ADDRESS',
    Processing: 'BEING PROCESSED FOR DELIVERY TO',
    Preparing: 'BEING PROCESSED FOR DELIVERY TO',
    Shipped: 'SHIPPED TO',
    Delivered: 'DELIVERED TO',
    Cancelled: 'DELIVERY ADDRESS',
}[status] || 'DELIVERY ADDRESS')

// every error goes back as { success: false, message } so the frontend can toast it
const fail = (res, error, status) => {
    const code = status || (error && error.name === 'ValidationError' ? 400 : 500)
    return res.status(code).json({
        success: false,
        message: (error && error.message) || error
    })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const dateRangeMatch = ({ startDate, endDate } = {}) => {
    const createdAt = {}
    if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`)
        if (!Number.isNaN(start.getTime())) createdAt.$gte = start
    }
    if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999Z`)
        if (!Number.isNaN(end.getTime())) createdAt.$lte = end
    }
    return Object.keys(createdAt).length ? { createdAt } : {}
}

// order flow: Pending -> Processing -> Shipped -> Delivered
// Cancelled is a side exit, only reachable from Pending (by the customer)
const ADMIN_STATUSES = ['Processing', 'Preparing', 'Shipped', 'Delivered']
const STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered']

const groupOrderQuantities = orderItems => {
    const quantities = new Map()
    for (const item of orderItems || []) {
        if (!item || typeof item !== 'object') {
            throw new Error('Each order item must be valid.')
        }
        const quantity = Number(item.quantity)
        if (!/^[a-f\d]{24}$/i.test(String(item.product || '')) || !Number.isInteger(quantity) || quantity < 1) {
            throw new Error('Each order item must have a valid product and a quantity of at least 1.')
        }
        const productId = String(item.product)
        quantities.set(productId, (quantities.get(productId) || 0) + quantity)
    }
    return quantities
}

const deductOrderStock = async (quantities) => {
    const adjusted = []
    try {
        for (const [productId, quantity] of quantities) {
            const product = await Product.findOneAndUpdate(
                { _id: productId, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } },
                { new: true }
            )
            if (!product) {
                const current = await Product.findById(productId).select('name stock')
                if (!current) throw new Error('An item in this order is no longer available.')
                throw new Error(`Only ${current.stock} unit(s) of ${current.name} are currently available.`)
            }
            adjusted.push({ productId, quantity })
        }
        return adjusted
    } catch (error) {
        await Promise.all(adjusted.map(({ productId, quantity }) =>
            Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
        ))
        throw error
    }
}

const restoreOrderStock = async adjusted => Promise.all((adjusted || []).map(({ productId, quantity }) =>
    Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
))

// POST /order/new
exports.newOrder = async (req, res) => {
    try {
        const { orderItems, shippingInfo, itemsPrice, taxPrice, shippingPrice, totalPrice, paymentInfo } = req.body

        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return fail(res, 'No order items', 400)
        }

        let requestedQuantities
        try {
            requestedQuantities = groupOrderQuantities(orderItems)
        } catch (error) {
            return fail(res, error.message, 400)
        }
        const products = await Product.find({ _id: { $in: [...requestedQuantities.keys()] } }).select('name stock')
        const productsById = new Map(products.map(product => [String(product._id), product]))
        for (const [productId, quantity] of requestedQuantities) {
            const product = productsById.get(productId)
            if (!product) return fail(res, 'An item in your cart is no longer available.', 400)
            if (quantity > product.stock) {
                return fail(res, `Only ${product.stock} unit(s) of ${product.name} are currently available.`, 400)
            }
        }

        // orderStatus is not taken from the body, the model default ('Pending') is used
        const order = await Order.create({
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo,
            paidAt: paymentInfo?.status === 'succeeded' ? Date.now() : undefined,
            user: req.user._id
        })

        await order.populate('user', 'name email')

        let emailSent = false
        let emailError
        if (order.user?.email) {
            const customerName = escapeHtml(order.user.name || 'Customer')
            const orderNumber = escapeHtml(order._id)
            const rows = (order.orderItems || []).map(item => `
                <tr><td style="padding:12px;border-bottom:1px solid #e3e9e5">${escapeHtml(item.name)}<br><span style="color:#6b7a73;font-size:12px">${escapeHtml(item.shade || 'Standard')} · Qty ${Number(item.quantity || 0)}</span></td>
                <td style="padding:12px;border-bottom:1px solid #e3e9e5;text-align:right">${peso(Number(item.price || 0) * Number(item.quantity || 0))}</td></tr>`).join('')
            const ship = order.shippingInfo || {}
            const address = [ship.address, ship.city, ship.postalCode, ship.country].filter(Boolean).map(escapeHtml).join(', ')
            const paymentStatus = order.paymentInfo?.status === 'succeeded' || order.paymentInfo?.id?.startsWith('CARD-') ? 'Paid' : 'Pay on delivery'
            const html = `<div style="background:#f2f6f3;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#263a31"><table style="width:100%;max-width:640px;margin:auto;background:#fff;border:1px solid #e3e9e5;border-collapse:collapse"><tr><td style="padding:22px 28px;background:#17332a;border-bottom:4px solid #c9a227"><img src="cid:cartify-logo" width="142" alt="Cartify" style="display:block"></td></tr><tr><td style="padding:28px"><div style="color:#8c7418;font-size:12px;font-weight:bold;letter-spacing:1px">ORDER CONFIRMATION</div><h1 style="color:#17332a;font-size:24px">Thanks for your order, ${customerName}!</h1><p>Your order is confirmed and is now <strong>Pending</strong>. We’ll email you as its status changes.</p><p><strong>Order #${orderNumber}</strong><br>${new Date(order.createdAt || Date.now()).toLocaleDateString('en-PH')}</p><table style="width:100%;border-collapse:collapse">${rows}</table><p>Subtotal: ${peso(order.itemsPrice)}<br>Shipping: ${peso(order.shippingPrice)}<br>Tax: ${peso(order.taxPrice)}<br><strong style="font-size:17px">Total: ${peso(order.totalPrice)}</strong></p><p><strong>Delivering to</strong><br>${customerName}<br>${address}<br>${escapeHtml(ship.phoneNo || '')}</p><p><strong>Payment:</strong> ${paymentStatus}</p></td></tr><tr><td style="padding:20px;background:#17332a;color:white;text-align:center">Your itemized PDF receipt is attached.<br>Thanks for shopping with Cartify!</td></tr></table></div>`
            const text = `Thanks for your order, ${order.user.name || 'Customer'}!\n\nOrder #${order._id}\nStatus: Pending\nTotal: ${peso(order.totalPrice)}\nPayment: ${paymentStatus}\nDelivering to: ${[ship.address, ship.city, ship.postalCode, ship.country].filter(Boolean).join(', ')}\n\nYour itemized PDF receipt is attached.`
            try {
                await sendEmail({
                    email: order.user.email,
                    subject: `Your Cartify order #${order._id} is confirmed`,
                    text,
                    html: emailHtml(html),
                    attachments: [
                        { filename: `Cartify-Receipt-${order._id}.pdf`, content: createOrderReceipt(order, order.user), contentType: 'application/pdf' },
                    ],
                })
                emailSent = true
            } catch (error) {
                emailError = error.message
                console.error(`Order confirmation email failed for ${order._id}: ${error.message}`)
            }
        } else {
            emailError = 'Customer email address is unavailable.'
        }

        res.status(200).json({ success: true, order, emailSent, emailError })
    } catch (error) {
        fail(res, error)
    }
}

// GET /order/:id   (owner or admin)
exports.getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email')

        if (!order) {
            return fail(res, 'No order found with this ID', 404)
        }

        const isOwner = order.user && String(order.user._id) === String(req.user._id)
        if (!isOwner && req.user.role !== 'admin') {
            return fail(res, 'You are not allowed to view this order', 403)
        }

        res.status(200).json({ success: true, order })
    } catch (error) {
        fail(res, error)
    }
}

// GET /orders/me
exports.myOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
        res.status(200).json({ success: true, orders })
    } catch (error) {
        fail(res, error)
    }
}

// PUT /order/:id/cancel   (owner only, and only while the order is still Pending)
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)

        if (!order) {
            return fail(res, 'No order found with this ID', 404)
        }

        if (String(order.user) !== String(req.user._id)) {
            return fail(res, 'You are not allowed to cancel this order', 403)
        }

        if (order.orderStatus !== 'Pending') {
            return fail(res, 'This order can no longer be cancelled', 400)
        }
        // Pending orders do not reserve inventory, so there is nothing to put back here.
        order.orderStatus = 'Cancelled'
        await order.save()

        res.status(200).json({ success: true })
    } catch (error) {
        fail(res, error)
    }
}

// GET /admin/orders
exports.allOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })

        // only completed deliveries count as realized revenue
        const totalAmount = orders
            .filter(order => order.orderStatus === 'Delivered')
            .reduce((acc, order) => acc + order.totalPrice, 0)

        res.status(200).json({ success: true, totalAmount, orders })
    } catch (error) {
        fail(res, error)
    }
}

// PUT /admin/order/:id   body: { status }
exports.updateOrder = async (req, res) => {
    try {
        let order = await Order.findById(req.params.id).populate('user', 'name email')

        if (!order) {
            return fail(res, 'No order found with this ID', 404)
        }

        if (order.orderStatus === 'Delivered') {
            return fail(res, 'This order has already been delivered', 400)
        }

        if (order.orderStatus === 'Cancelled') {
            return fail(res, 'This order was cancelled by the customer', 400)
        }
        const { status } = req.body
        if (!ADMIN_STATUSES.includes(status)) {
            return fail(res, 'Please choose a valid status', 400)
        }

        // Preparing is the legacy name for Processing; keep accepting it for older clients.
        const currentStatus = order.orderStatus === 'Preparing' ? 'Processing' : order.orderStatus
        const nextStatus = status === 'Preparing' ? 'Processing' : status
        const currentStatusIndex = STATUS_FLOW.indexOf(currentStatus)
        const nextStatusIndex = STATUS_FLOW.indexOf(nextStatus)
        if (currentStatusIndex < 0 || nextStatusIndex <= currentStatusIndex) {
            return fail(res, 'Order status must move forward.', 400)
        }

        const processingIndex = STATUS_FLOW.indexOf('Processing')
        const shouldDeductStock = !order.stockDeducted &&
            currentStatusIndex < nextStatusIndex && nextStatusIndex >= processingIndex
        if (shouldDeductStock) {
            let adjustedStock = []
            try {
                adjustedStock = await deductOrderStock(groupOrderQuantities(order.orderItems))
                const updateFields = { orderStatus: nextStatus, stockDeducted: true }
                if (nextStatus === 'Delivered') updateFields.deliveredAt = Date.now()
                const processedOrder = await Order.findOneAndUpdate(
                    { _id: order._id, orderStatus: order.orderStatus, stockDeducted: { $ne: true } },
                    { $set: updateFields },
                    { new: true }
                ).populate('user', 'name email')
                if (!processedOrder) {
                    await restoreOrderStock(adjustedStock)
                    return fail(res, 'This order has already changed. Refresh and try again.', 409)
                }
                order = processedOrder
            } catch (error) {
                await restoreOrderStock(adjustedStock)
                return fail(res, error.message, 409)
            }
        } else {
            order.orderStatus = nextStatus
            if (nextStatus === 'Delivered') order.deliveredAt = Date.now()
            await order.save()
        }

        let emailSent = false
        let emailError
        if (order.user?.email) {
            const itemRows = (order.orderItems || []).map(item => {
                const variant = item.shade ? escapeHtml(item.shade) : 'Standard'
                const lineTotal = Number(item.price || 0) * Number(item.quantity || 0)
                return `<tr>
                    <td style="padding:14px 12px;border-bottom:1px solid #e3e9e5;color:#17332a;font-weight:700">${escapeHtml(item.name)}<div style="padding-top:4px;color:#6b7a73;font-size:12px;font-weight:400">Variant: ${variant}</div></td>
                    <td style="padding:14px 8px;border-bottom:1px solid #e3e9e5;text-align:center;color:#33433b">${Number(item.quantity || 0)}</td>
                    <td style="padding:14px 8px;border-bottom:1px solid #e3e9e5;text-align:right;color:#33433b;white-space:nowrap">${peso(item.price)}</td>
                    <td style="padding:14px 12px;border-bottom:1px solid #e3e9e5;text-align:right;color:#17332a;font-weight:700;white-space:nowrap">${peso(lineTotal)}</td>
                </tr>`
            }).join('')
            const itemText = (order.orderItems || []).map(item => {
                const variant = item.shade || 'Standard'
                return `• ${item.name}\n  Variant: ${variant} | Qty: ${item.quantity} | Unit price: ${peso(item.price)} | Line total: ${peso(Number(item.price || 0) * Number(item.quantity || 0))}`
            }).join('\n')
            const customerName = escapeHtml(order.user.name || 'Customer')
            const orderNumber = escapeHtml(order._id)
            const statusLabel = escapeHtml(customerStatus(nextStatus))
            const ship = order.shippingInfo || {}
            const address = [ship.address, ship.city, ship.postalCode, ship.country].filter(Boolean).map(escapeHtml).join(', ')
            const paymentStatus = order.paymentInfo?.status === 'succeeded' || order.paymentInfo?.id?.startsWith('CARD-') ? 'Paid' : 'Pay on delivery'
            const paymentReference = escapeHtml(order.paymentInfo?.id || 'COD')
            const html = `<div style="margin:0;padding:28px 12px;background:#f2f6f3;font-family:Arial,Helvetica,sans-serif;color:#263a31">
              <table role="presentation" style="width:100%;max-width:720px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #e3e9e5;border-radius:12px;overflow:hidden">
                <tr><td style="padding:22px 30px;background:#17332a;border-bottom:4px solid #c9a227">
                  <img src="cid:cartify-logo" width="142" alt="Cartify" style="display:block;width:142px;height:auto;max-height:48px;object-fit:contain">
                  <div style="padding-top:10px;color:#dce7e0;font-size:11px;letter-spacing:1.5px">YOUR ORDER, BEAUTIFULLY WRAPPED</div>
                </td></tr>
                <tr><td style="padding:30px 30px 12px">
                  <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8c7418">Order update</div>
                  <h1 style="margin:8px 0 10px;font-size:25px;line-height:1.25;color:#17332a">A little update on your Cartify order</h1>
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Hi ${customerName}, thank you for shopping with Cartify. We truly appreciate your order.</p>
                  <table role="presentation" style="width:100%;border-collapse:collapse;background:#eef3f0;border-radius:8px"><tr>
                    <td style="padding:13px 15px;font-size:13px;line-height:1.6"><span style="color:#6b7a73">Order</span><br><strong style="color:#17332a">#${orderNumber}</strong></td>
                    <td style="padding:13px 15px;text-align:right;font-size:13px;line-height:1.6"><span style="color:#6b7a73">Current status</span><br><span style="display:inline-block;padding:4px 10px;background:#f7eecb;border-radius:14px;color:#755f12;font-weight:700">${statusLabel}</span></td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding:18px 30px 8px"><h2 style="margin:0;font-size:17px;color:#17332a">Your items</h2></td></tr>
                <tr><td style="padding:0 30px">
                  <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px">
                    <thead><tr style="background:#eef3f0;color:#17332a"><th style="padding:11px 12px;text-align:left">Product / variant</th><th style="padding:11px 8px;text-align:center">Qty</th><th style="padding:11px 8px;text-align:right">Unit price</th><th style="padding:11px 12px;text-align:right">Amount</th></tr></thead>
                    <tbody>${itemRows}</tbody>
                  </table>
                </td></tr>
                <tr><td style="padding:18px 30px 8px">
                  <table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="width:50%;vertical-align:top;padding:15px;background:#f7f9f7;border:1px solid #e3e9e5">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#6b7a73">${deliveryHeading(nextStatus)}</div>
                    <div style="padding-top:8px;font-size:13px;line-height:1.65;color:#17332a"><strong>${customerName}</strong><br>${address}<br>${escapeHtml(ship.phoneNo || '')}<br>${escapeHtml(order.user.email)}</div>
                  </td><td style="width:50%;vertical-align:top;padding:15px;background:#f7f9f7;border:1px solid #e3e9e5;border-left:0">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#6b7a73">PAYMENT</div>
                    <div style="padding-top:8px;font-size:13px;line-height:1.65;color:#17332a"><strong>${paymentStatus}</strong><br>Reference: ${paymentReference}<br>Order date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-PH')}</div>
                  </td></tr></table>
                </td></tr>
                <tr><td style="padding:8px 30px 22px">
                  <table role="presentation" style="width:100%;max-width:340px;margin-left:auto;border-collapse:collapse;font-size:13px">
                    <tr><td style="padding:6px 0;color:#6b7a73">Subtotal</td><td style="padding:6px 0;text-align:right">${peso(order.itemsPrice)}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7a73">Shipping</td><td style="padding:6px 0;text-align:right">${peso(order.shippingPrice)}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7a73">Tax</td><td style="padding:6px 0;text-align:right">${peso(order.taxPrice)}</td></tr>
                    <tr><td style="padding:12px 0 4px;border-top:2px solid #c9a227;color:#17332a;font-size:15px;font-weight:700">Grand total</td><td style="padding:12px 0 4px;border-top:2px solid #c9a227;text-align:right;color:#17332a;font-size:17px;font-weight:700">${peso(order.totalPrice)}</td></tr>
                  </table>
                </td></tr>
                <tr><td style="padding:20px 30px;background:#17332a;color:#e5eee9;text-align:center">
                  <div style="font-size:15px;font-weight:700;color:#ffffff">Thanks for making Cartify part of your day.</div>
                  <div style="padding-top:7px;font-size:12px;line-height:1.6">Your itemized PDF receipt is attached for your records.<br>We hope your new finds bring you joy.</div>
                </td></tr>
              </table>
            </div>`
            const text = `CARTIFY ORDER UPDATE\n${'='.repeat(42)}\n\nHi ${order.user.name || 'Customer'},\n\nThank you for shopping with Cartify. We truly appreciate your order.\n\nOrder: #${order._id}\nStatus: ${customerStatus(nextStatus)}\nDate: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-PH')}\n\nITEMS\n${'-'.repeat(42)}\n${itemText}\n\nSubtotal: ${peso(order.itemsPrice)}\nShipping: ${peso(order.shippingPrice)}\nTax: ${peso(order.taxPrice)}\nGRAND TOTAL: ${peso(order.totalPrice)}\n\n${deliveryHeading(nextStatus)}\n${order.user.name || 'Customer'}\n${[ship.address, ship.city, ship.postalCode, ship.country].filter(Boolean).join(', ')}\nPhone: ${ship.phoneNo || 'Not provided'}\nEmail: ${order.user.email}\n\nPAYMENT\n${paymentStatus} | Reference: ${order.paymentInfo?.id || 'COD'}\n\nYour itemized PDF receipt is attached for your records.\nThanks for making Cartify part of your day!`

            try {
                await sendEmail({
                    email: order.user.email,
                    subject: `Cartify order #${order._id} is ${nextStatus}`,
                    text,
                    html: emailHtml(html),
                    attachments: [
                        {
                            filename: `Cartify-Receipt-${order._id}.pdf`,
                            content: createOrderReceipt(order, order.user),
                            contentType: 'application/pdf',
                        },
                    ],
                })
                emailSent = true
            } catch (error) {
                emailError = error.message
                console.error(`Order update email failed for ${order._id}: ${error.message}`)
            }
        } else {
            emailError = 'Customer email address is unavailable.'
        }

        res.status(200).json({ success: true, emailSent, emailError })
    } catch (error) {
        fail(res, error)
    }
}

// DELETE /admin/order/:id
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)

        if (!order) {
            return fail(res, 'No order found with this ID', 404)
        }

        await order.deleteOne()

        res.status(200).json({ success: true })
    } catch (error) {
        fail(res, error)
    }
}

/* ------------------------- dashboard chart data ------------------------- */

// GET /admin/sales-per-month  ->  [{ month: 'Oct 2026', total }]
exports.salesPerMonth = async (req, res) => {
    try {
        const data = await Order.aggregate([
            { $match: { orderStatus: 'Delivered', ...dateRangeMatch(req.query) } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    total: { $sum: '$totalPrice' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])

        const salesPerMonth = data.map(d => ({
            month: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
            total: d.total
        }))

        res.status(200).json({ success: true, salesPerMonth })
    } catch (error) {
        fail(res, error)
    }
}

// GET /admin/product-sales  ->  [{ name, percent }]   percent is 0-100
exports.productSales = async (req, res) => {
    try {
        const rows = await Order.aggregate([
            { $match: { orderStatus: 'Delivered', ...dateRangeMatch(req.query) } },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.name',
                    total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
                }
            },
            { $sort: { total: -1 } }
        ])

        const grandTotal = rows.reduce((acc, r) => acc + r.total, 0)

        const totalPercentage = rows.map(r => ({
            name: r._id,
            percent: grandTotal ? Number(((r.total / grandTotal) * 100).toFixed(1)) : 0
        }))

        res.status(200).json({ success: true, totalPercentage })
    } catch (error) {
        fail(res, error)
    }
}

// GET /admin/customer-sales  ->  [{ total, userDetails: { name } }]  (top 10)
exports.customerSales = async (req, res) => {
    try {
        const customerSales = await Order.aggregate([
            { $match: { orderStatus: 'Delivered', ...dateRangeMatch(req.query) } },
            { $group: { _id: '$user', total: { $sum: '$totalPrice' } } },
            { $sort: { total: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
            { $unwind: '$userDetails' },
            { $project: { _id: 0, total: 1, 'userDetails.name': 1 } }
        ])

        res.status(200).json({ success: true, customerSales })
    } catch (error) {
        fail(res, error)
    }
}
