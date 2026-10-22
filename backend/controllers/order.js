const Order = require('../models/order')
const Product = require('../models/product')

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

// order flow: Pending -> Preparing -> Shipped -> Delivered
// Cancelled is a side exit, only reachable from Pending (by the customer)
const ADMIN_STATUSES = ['Pending', 'Preparing', 'Shipped', 'Delivered']

// POST /order/new
exports.newOrder = async (req, res) => {
    try {
        const { orderItems, shippingInfo, itemsPrice, taxPrice, shippingPrice, totalPrice, paymentInfo } = req.body

        if (!orderItems || orderItems.length === 0) {
            return fail(res, 'No order items', 400)
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

        res.status(200).json({ success: true, order })
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

        // stock is only reduced on delivery, so there is nothing to put back here
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

        // cancelled orders are not counted as revenue
        const totalAmount = orders
            .filter(order => order.orderStatus !== 'Cancelled')
            .reduce((acc, order) => acc + order.totalPrice, 0)

        res.status(200).json({ success: true, totalAmount, orders })
    } catch (error) {
        fail(res, error)
    }
}

// PUT /admin/order/:id   body: { status }
exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)

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

        // stock goes down once, when the order is delivered
        if (status === 'Delivered') {
            for (const item of order.orderItems) {
                const product = await Product.findById(item.product)
                if (product) {
                    product.stock = Math.max(0, product.stock - item.quantity)
                    await product.save({ validateBeforeSave: false })
                }
            }
            order.deliveredAt = Date.now()
        }

        order.orderStatus = status
        await order.save()

        res.status(200).json({ success: true })
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
            { $match: { orderStatus: { $ne: 'Cancelled' }, ...dateRangeMatch(req.query) } },
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
            { $match: { orderStatus: { $ne: 'Cancelled' }, ...dateRangeMatch(req.query) } },
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
            { $match: { orderStatus: { $ne: 'Cancelled' }, ...dateRangeMatch(req.query) } },
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
