const express = require('express')
const router = express.Router()

const {
    newOrder,
    getSingleOrder,
    myOrders,
    cancelOrder,
    allOrders,
    updateOrder,
    deleteOrder,
    salesPerMonth,
    productSales,
    customerSales
} = require('../controllers/order')

// ⚠ copy the exact require line + function names from your routes/product.js
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')

// customer
router.post('/order/new', isAuthenticatedUser, newOrder)
router.get('/orders/me', isAuthenticatedUser, myOrders)
router.put('/order/:id/cancel', isAuthenticatedUser, cancelOrder)
router.get('/order/:id', isAuthenticatedUser, getSingleOrder)

// admin
router.get('/admin/orders', isAuthenticatedUser, authorizeRoles('admin'), allOrders)
router.route('/admin/order/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder)

// dashboard charts
router.get('/admin/sales-per-month', isAuthenticatedUser, authorizeRoles('admin'), salesPerMonth)
router.get('/admin/product-sales', isAuthenticatedUser, authorizeRoles('admin'), productSales)
router.get('/admin/customer-sales', isAuthenticatedUser, authorizeRoles('admin'), customerSales)

module.exports = router
