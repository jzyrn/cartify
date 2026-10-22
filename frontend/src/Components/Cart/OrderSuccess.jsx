import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box, Button, Container, Paper, Typography } from '@mui/material'

import MetaData from '../Layout/MetaData'
import { GREEN, GREEN_DARK, GOLD, peso, formatOrderNumber } from './checkoutUtils'

const OrderSuccess = () => {
    const location = useLocation()
    const order = location.state?.order
    const paymentId = order?.paymentInfo?.id || ''
    const isCardPayment = paymentId.startsWith('CARD-')
    const paymentLabel = isCardPayment
        ? `Card ending in ${paymentId.slice(-4)}`
        : 'Cash on delivery'

    return (
        <>
            <MetaData title="Order placed" />
            <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
                <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 3, md: 5 }, textAlign: 'center' }}>
                    {order ? (
                        <>
                            <Typography variant="h4" fontWeight={700} sx={{ color: GREEN, mb: 1 }}>
                                Order placed
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Thank you for shopping with Cartify. We will start preparing your order.
                            </Typography>

                            <Box sx={{ bgcolor: '#f6f5f1', borderRadius: 2, p: 2.5, mb: 3, textAlign: 'left' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography color="text.secondary">Order number</Typography>
                                    <Typography fontWeight={700}>{formatOrderNumber(order)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography color="text.secondary">Total</Typography>
                                    <Typography fontWeight={700}>{peso(order.totalPrice)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography color="text.secondary">Payment</Typography>
                                    <Typography fontWeight={700}>{paymentLabel}</Typography>
                                </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                You can cancel this order from your orders page while its status is Pending.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center' }}>
                                <Button
                                    component={Link}
                                    to={`/order/${order._id}`}
                                    variant="contained"
                                    disableElevation
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        bgcolor: GREEN,
                                        borderBottom: `3px solid ${GOLD}`,
                                        '&:hover': { bgcolor: GREEN_DARK, color: GOLD },
                                    }}
                                >
                                    View order
                                </Button>
                                <Button
                                    component={Link}
                                    to="/"
                                    variant="outlined"
                                    sx={{ textTransform: 'none', fontWeight: 600, color: GREEN, borderColor: '#d9d7d2', '&:hover': { borderColor: GREEN } }}
                                >
                                    Continue shopping
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Typography variant="h5" fontWeight={700} sx={{ color: GREEN, mb: 1 }}>
                                No recent order
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Your orders are listed on your orders page.
                            </Typography>
                            <Button
                                component={Link}
                                to="/orders/me"
                                variant="contained"
                                disableElevation
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    bgcolor: GREEN,
                                    borderBottom: `3px solid ${GOLD}`,
                                    '&:hover': { bgcolor: GREEN_DARK, color: GOLD },
                                }}
                            >
                                View my orders
                            </Button>
                        </>
                    )}
                </Paper>
            </Container>
        </>
    )
}

export default OrderSuccess
