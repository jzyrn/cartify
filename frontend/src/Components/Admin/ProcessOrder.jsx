import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { AdminLayout, PageHeader, PageLoader, InfoRow, StatusPill, primaryBtnSx, fieldSx, cardSx, GREEN, GOLD } from './AdminUI'
import { getOrderDetails, updateOrder, clearErrors } from '../../actions/orderActions'
import { UPDATE_ORDER_RESET } from '../../constants/orderConstants'

const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered']

const ProcessOrder = () => {
    const dispatch = useDispatch()
    const { loading, order = {} } = useSelector(state => state.orderDetails)
    const { error, isUpdated } = useSelector(state => state.order)

    const [status, setStatus] = useState('')
    let navigate = useNavigate()

    let { id } = useParams()
    const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order
    const orderId = id
    const currentStatus = orderStatus === 'Preparing' ? 'Processing' : orderStatus
    const currentStatusIndex = STATUS_FLOW.indexOf(currentStatus)
    const terminalStatus = currentStatus === 'Delivered' || currentStatus === 'Cancelled'

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-center' })
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-center' })

    useEffect(() => {
        dispatch(getOrderDetails(orderId))
        if (error) {
            errMsg(error)
            dispatch(clearErrors())
        }
        if (isUpdated) {
            successMsg('Order updated successfully')
            dispatch({ type: UPDATE_ORDER_RESET })
            navigate('/admin/orders')
        }
    }, [error, isUpdated, orderId])

    const updateOrderHandler = (id) => {
        if (!status) return
        dispatch(updateOrder(id, { status }))
    }

    const shippingDetails = shippingInfo && `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`
    const isPaid = paymentInfo?.status === 'succeeded' || paymentInfo?.id?.startsWith('CARD-')
    const delivered = order.orderStatus && String(order.orderStatus).includes('Delivered')

    return (
        <>
            <MetaData title={`Process Order # ${order && order._id}`} />
            <AdminLayout>
                {loading ? (
                    <PageLoader />
                ) : (
                    <>
                        <PageHeader title={`Order #${order._id || ''}`} subtitle="Review the order and update its status" />

                        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, alignItems: 'start' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Paper variant="outlined" sx={cardSx}>
                                    <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>Shipping Info</Typography>
                                    <InfoRow label="Name">{user && user.name}</InfoRow>
                                    <InfoRow label="Phone">{shippingInfo && shippingInfo.phoneNo}</InfoRow>
                                    <InfoRow label="Address">{shippingDetails}</InfoRow>
                                    <InfoRow label="Amount">{peso(totalPrice)}</InfoRow>
                                </Paper>

                                <Paper variant="outlined" sx={cardSx}>
                                    <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>Payment</Typography>
                                    <InfoRow label="Payment status">
                                        <StatusPill label={isPaid ? 'PAID' : 'NOT PAID'} tone={isPaid ? 'good' : 'danger'} />
                                    </InfoRow>
                                    <InfoRow label="Payment reference">{paymentInfo && paymentInfo.id}</InfoRow>
                                </Paper>

                                <Paper variant="outlined" sx={cardSx}>
                                    <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>Order Items</Typography>
                                    {orderItems && orderItems.map(item => (
                                        <Box
                                            key={item.product}
                                            sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid #eef3f0', '&:last-of-type': { borderBottom: 0 } }}
                                        >
                                            <Box
                                                component="img"
                                                src={item.image}
                                                alt={item.name}
                                                sx={{ width: 64, height: 56, objectFit: 'cover', borderRadius: 2, bgcolor: '#eef3f0' }}
                                            />
                                            <Typography
                                                component={Link}
                                                to={`/product/${item.product}`}
                                                sx={{ flex: 1, color: GREEN, fontWeight: 600, textDecoration: 'none', '&:hover': { color: GOLD } }}
                                            >
                                                {item.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">{item.quantity} pc(s)</Typography>
                                            <Typography fontWeight={700} sx={{ color: GREEN, minWidth: 90, textAlign: 'right' }}>
                                                {peso(item.price)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            </Box>

                            <Paper variant="outlined" sx={{ ...cardSx, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box>
                                    <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>Order Status</Typography>
                                <StatusPill label={orderStatus === 'Preparing' ? 'Processing' : orderStatus} tone={delivered ? 'good' : 'gold'} />
                                </Box>

                                <TextField
                                    label="Update status"
                                    name="status"
                                    select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    fullWidth
                                    disabled={terminalStatus}
                                    sx={fieldSx}
                                >
                                    <MenuItem value="" disabled>Select status</MenuItem>
                                    <MenuItem value="Pending" disabled>Pending</MenuItem>
                                    {/* Keep the legacy API value while showing the user-friendly label. */}
                                    <MenuItem value="Preparing" disabled={currentStatusIndex !== 0}>Processing</MenuItem>
                                    <MenuItem value="Shipped" disabled={currentStatusIndex >= 2}>Shipped</MenuItem>
                                    <MenuItem value="Delivered" disabled={currentStatusIndex >= 3}>Delivered</MenuItem>
                                </TextField>

                                <Button fullWidth disableElevation disabled={!status} sx={primaryBtnSx} onClick={() => updateOrderHandler(order._id)}>
                                    Update Status
                                </Button>
                            </Paper>
                        </Box>
                    </>
                )}
            </AdminLayout>
        </>
    )
}

export default ProcessOrder
