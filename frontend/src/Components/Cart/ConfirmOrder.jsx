import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, Button, Container, Divider, Paper, Typography } from '@mui/material'

import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { GREEN, GREEN_DARK, GOLD, peso, calcTotals } from './checkoutUtils'

const Row = ({ label, children }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
        <Typography component="span" color="text.secondary">{label}</Typography>
        <Typography component="span" fontWeight={600} sx={{ textAlign: 'right' }}>{children}</Typography>
    </Box>
)

const ConfirmOrder = () => {
    const navigate = useNavigate()
    const { cartItems, shippingInfo } = useSelector((state) => state.cart)
    const { user } = useSelector((state) => state.auth)

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/cart', { replace: true })
        } else if (!shippingInfo?.address) {
            navigate('/shipping', { replace: true })
        }
    }, [cartItems.length, shippingInfo, navigate])

    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calcTotals(cartItems)

    const address = shippingInfo?.address
        ? `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`
        : ''

    return (
        <>
            <MetaData title="Confirm order" />
            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
                <CheckoutSteps activeStep={1} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 340px' }, gap: 3, alignItems: 'start' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography fontWeight={700} sx={{ color: GREEN }}>Shipping details</Typography>
                                <Typography component={Link} to="/shipping" variant="body2" sx={{ color: GREEN, fontWeight: 600, textDecoration: 'none', '&:hover': { color: GOLD } }}>
                                    ← Edit shipping
                                </Typography>
                            </Box>
                            <Row label="Name">{user?.name}</Row>
                            <Row label="Phone">{shippingInfo?.phoneNo}</Row>
                            <Row label="Address">{address}</Row>
                        </Paper>

                        <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                            <Typography fontWeight={700} sx={{ color: GREEN, mb: 1 }}>
                                Your items ({cartItems.length})
                            </Typography>
                            {cartItems.map((item) => (
                                <Box
                                    key={`${item.product}-${item.shade || ''}`}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid #eef3f0', '&:last-of-type': { borderBottom: 0 } }}
                                >
                                    <Box
                                        sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'grey.100', overflow: 'hidden', flexShrink: 0 }}
                                    >
                                        {item.image && (
                                            <Box component="img" src={item.image} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            component={Link}
                                            to={`/product/${item.product}`}
                                            fontWeight={600}
                                            noWrap
                                            sx={{ display: 'block', color: 'text.primary', textDecoration: 'none', '&:hover': { color: GOLD } }}
                                        >
                                            {item.name}
                                        </Typography>
                                        {item.shade && (
                                            <Typography variant="body2" color="text.secondary">Shade: {item.shade}</Typography>
                                        )}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {item.quantity} × {peso(item.price)}
                                    </Typography>
                                    <Typography fontWeight={700} sx={{ color: GREEN, minWidth: 90, textAlign: 'right' }}>
                                        {peso(item.quantity * item.price)}
                                    </Typography>
                                </Box>
                            ))}
                        </Paper>
                    </Box>

                    <Paper variant="outlined" component="aside" sx={{ borderRadius: 3, p: 3, position: { md: 'sticky' }, top: { md: 24 } }}>
                        <Typography variant="h6" fontWeight={700}>Order summary</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Row label="Subtotal">{peso(itemsPrice)}</Row>
                        <Row label="Shipping">{shippingPrice === 0 ? 'Free' : peso(shippingPrice)}</Row>
                        {taxPrice > 0 && <Row label="Tax">{peso(taxPrice)}</Row>}
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography fontWeight={700}>Total</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: GREEN }}>{peso(totalPrice)}</Typography>
                        </Box>
                        <Button
                            id="checkout_btn"
                            fullWidth
                            size="large"
                            variant="contained"
                            disableElevation
                            onClick={() => navigate('/payment')}
                            sx={{
                                mt: 3,
                                py: 1.4,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: GREEN,
                                borderBottom: `3px solid ${GOLD}`,
                                '&:hover': { bgcolor: GREEN_DARK, color: GOLD },
                            }}
                        >
                            Continue to payment
                        </Button>
                    </Paper>
                </Box>
            </Container>
        </>
    )
}

export default ConfirmOrder
