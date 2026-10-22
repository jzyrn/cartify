import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Box, Container, Paper, Typography } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { PageHeader, PageLoader, InfoRow, StatusPill, cardSx, GREEN, GOLD } from '../Admin/AdminUI'
import { formatOrderNumber } from '../Cart/checkoutUtils'
import { clearErrors, getOrderDetails } from '../../actions/orderActions'

const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const OrderDetails = () => {
    const dispatch = useDispatch()
    const { loading, error, order = {} } = useSelector(state => state.orderDetails)

    const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order
    let { id } = useParams()

    useEffect(() => {
        dispatch(getOrderDetails(id))
    }, [dispatch, id])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
    }, [error, dispatch])

    const shippingDetails = shippingInfo && `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`
    const isPaid = paymentInfo?.status === 'succeeded' || paymentInfo?.id?.startsWith('CARD-')
    const delivered = orderStatus && String(orderStatus).includes('Delivered')

    return (
        <>
            <MetaData title={'Order Details'} />
            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                    component={Link}
                    to="/orders/me"
                    variant="body2"
                    sx={{ color: GREEN, fontWeight: 600, textDecoration: 'none', '&:hover': { color: GOLD }, alignSelf: 'flex-start' }}
                >
                    ← Back to my orders
                </Typography>

                {loading ? (
                    <PageLoader />
                ) : (
                    <>
                        <PageHeader
                            title={`Order #${formatOrderNumber(order)}`}
                            subtitle="Details of your order"
                            action={<StatusPill label={orderStatus === 'Preparing' ? 'Processing' : orderStatus} tone={delivered ? 'good' : 'gold'} />}
                        />

                        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
                            <Paper variant="outlined" sx={cardSx}>
                                <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>Order Items</Typography>
                                {orderItems && orderItems.map(item => (
                                    <Box
                                        key={`${item.product}-${item.shade || ''}`}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid #eef3f0', '&:last-of-type': { borderBottom: 0 } }}
                                    >
                                        <Box
                                            component="img"
                                            src={item.image}
                                            alt={item.name}
                                            sx={{ width: 64, height: 56, objectFit: 'cover', borderRadius: 2, bgcolor: '#eef3f0' }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                component={Link}
                                                to={`/product/${item.product}`}
                                                sx={{ color: GREEN, fontWeight: 600, textDecoration: 'none', '&:hover': { color: GOLD } }}
                                            >
                                                {item.name}
                                            </Typography>
                                            {item.shade && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                                    Shade / variant: {item.shade}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{item.quantity} pc(s)</Typography>
                                        <Typography fontWeight={700} sx={{ color: GREEN, minWidth: 90, textAlign: 'right' }}>
                                            {peso(item.price)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Paper>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Paper variant="outlined" sx={cardSx}>
                                    <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>Shipping Info</Typography>
                                    <InfoRow label="Name">{user && user.name}</InfoRow>
                                    <InfoRow label="Phone">{shippingInfo && shippingInfo.phoneNo}</InfoRow>
                                    <InfoRow label="Address">{shippingDetails}</InfoRow>
                                </Paper>

                                <Paper variant="outlined" sx={cardSx}>
                                    <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>Payment</Typography>
                                    <InfoRow label="Status">
                                        <StatusPill label={isPaid ? 'PAID' : 'NOT PAID'} tone={isPaid ? 'good' : 'danger'} />
                                    </InfoRow>
                                    <InfoRow label="Total">{peso(totalPrice)}</InfoRow>
                                </Paper>
                            </Box>
                        </Box>
                    </>
                )}
            </Container>
        </>
    )
}

export default OrderDetails
