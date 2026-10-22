import React, { useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Container,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material'

import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { createOrder } from '../../actions/orderActions'
import { clearCart } from '../../actions/cartActions'
import { GREEN, GREEN_DARK, GOLD, peso, calcTotals, PLACEHOLDER_IMAGE } from './checkoutUtils'

const Payment = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { cartItems, shippingInfo } = useSelector((state) => state.cart)
    const { user } = useSelector((state) => state.auth)

    const [method, setMethod] = useState('cod')
    const [cardDialogOpen, setCardDialogOpen] = useState(false)
    const [savedCards, setSavedCards] = useState(() => {
        try {
            const key = `cartify-saved-cards-${user?._id || user?.id || 'guest'}`
            return JSON.parse(localStorage.getItem(key) || '[]')
        } catch {
            return []
        }
    })
    const [selectedCard, setSelectedCard] = useState(null)
    const [placing, setPlacing] = useState(false)
    const [error, setError] = useState('')

    // once the order is placed the cart is emptied, so the guard below must not bounce us to /cart
    const placedRef = useRef(false)

    useEffect(() => {
        if (placedRef.current) return
        if (cartItems.length === 0) {
            navigate('/cart', { replace: true })
        } else if (!shippingInfo?.address) {
            navigate('/shipping', { replace: true })
        }
    }, [cartItems.length, shippingInfo, navigate])

    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calcTotals(cartItems)

    const cardForm = useFormik({
        initialValues: { savedCard: '', cardholder: '', cardNumber: '', expiry: '', cvc: '', saveCard: false },
        validate: (values) => {
            const errors = {}
            const digits = values.cardNumber.replace(/\D/g, '')
            if (!values.savedCard && digits.length < 12) errors.cardNumber = 'Enter a valid card number'
            if (!values.cardholder.trim()) errors.cardholder = 'Enter the name on the card'
            if (!/^((0[1-9])|(1[0-2]))\/\d{2}$/.test(values.expiry)) errors.expiry = 'Use MM/YY'
            if (!/^\d{3,4}$/.test(values.cvc)) errors.cvc = 'Enter a valid security code'
            return errors
        },
        onSubmit: (values) => {
            const cardNumber = values.cardNumber.replace(/\D/g, '')
            const card = values.savedCard
                ? savedCards.find((item) => item.id === values.savedCard)
                : { cardholder: values.cardholder.trim(), last4: cardNumber.slice(-4), expiry: values.expiry }

            if (!card) return
            setSelectedCard(card)
            setMethod('card')

            if (values.saveCard && !values.savedCard) {
                const next = [...savedCards, { ...card, id: `${Date.now()}` }]
                setSavedCards(next)
                const key = `cartify-saved-cards-${user?._id || user?.id || 'guest'}`
                localStorage.setItem(key, JSON.stringify(next))
            }

            setCardDialogOpen(false)
            cardForm.resetForm()
        },
    })

    const openCardDialog = () => {
        setMethod('card')
        setCardDialogOpen(true)
    }

    const changeCardNumber = (event) => {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 19)
        cardForm.setFieldValue('cardNumber', digits.replace(/(.{4})/g, '$1 ').trim())
    }

    const placeOrder = async () => {
        if (placing) return
        if (method === 'card' && !selectedCard) {
            setCardDialogOpen(true)
            return
        }
        setPlacing(true)
        setError('')

        const order = {
            orderItems: cartItems.map((item) => ({
                product: item.product,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image || PLACEHOLDER_IMAGE,
                shade: item.shade || '',
            })),
            shippingInfo: {
                address: shippingInfo.address,
                city: shippingInfo.city,
                postalCode: shippingInfo.postalCode,
                phoneNo: shippingInfo.phoneNo,
                country: shippingInfo.country,
            },
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo: method === 'card'
                ? { id: `CARD-****${selectedCard?.last4 || ''}`, status: 'succeeded' }
                : { id: 'COD', status: 'Pending' },
        }

        const result = await dispatch(createOrder(order))
        setPlacing(false)

        if (result?.success && result.order) {
            placedRef.current = true
            dispatch(clearCart())
            navigate('/success', { replace: true, state: { order: result.order } })
        } else {
            setError(result?.message || 'We could not place your order. Please try again.')
        }
    }

    return (
        <>
            <MetaData title="Payment" />
            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
                <CheckoutSteps activeStep={2} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 340px' }, gap: 3, alignItems: 'start' }}>
                    <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ color: GREEN, mb: 2 }}>
                            How would you like to pay?
                        </Typography>

                        {error && (
                            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <FormControl>
                            <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
                                <FormControlLabel
                                    value="cod"
                                    control={<Radio sx={{ '&.Mui-checked': { color: GREEN } }} />}
                                    label={
                                        <Box>
                                            <Typography fontWeight={600}>Cash on delivery</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Pay the courier when your order arrives.
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ alignItems: 'flex-start', mb: 1.5 }}
                                />
                                <FormControlLabel
                                    value="card"
                                    onClick={openCardDialog}
                                    control={<Radio sx={{ '&.Mui-checked': { color: GREEN } }} />}
                                    label={
                                        <Box>
                                            <Typography fontWeight={600}>Card</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedCard ? `Pay with card ending in ${selectedCard.last4}` : 'Credit or debit card'}
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ alignItems: 'flex-start' }}
                                />
                            </RadioGroup>
                        </FormControl>

                        <Typography
                            component={Link}
                            to="/confirm"
                            variant="body2"
                            sx={{ display: 'inline-block', mt: 2, color: GREEN, fontWeight: 600, textDecoration: 'none', '&:hover': { color: GOLD } }}
                        >
                            ← Back to order review
                        </Typography>
                    </Paper>

                    <Paper variant="outlined" component="aside" sx={{ borderRadius: 3, p: 3, position: { md: 'sticky' }, top: { md: 24 } }}>
                        <Typography variant="h6" fontWeight={700}>Order summary</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography color="text.secondary">Subtotal</Typography>
                            <Typography fontWeight={600}>{peso(itemsPrice)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography color="text.secondary">Shipping</Typography>
                            <Typography fontWeight={600}>{shippingPrice === 0 ? 'Free' : peso(shippingPrice)}</Typography>
                        </Box>
                        {taxPrice > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography color="text.secondary">Tax</Typography>
                                <Typography fontWeight={600}>{peso(taxPrice)}</Typography>
                            </Box>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography fontWeight={700}>Total</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: GREEN }}>{peso(totalPrice)}</Typography>
                        </Box>
                        <Button
                            id="pay_btn"
                            fullWidth
                            size="large"
                            variant="contained"
                            disableElevation
                            disabled={placing}
                            onClick={placeOrder}
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
                            {placing ? 'Placing order…' : method === 'card' && selectedCard
                                ? `Pay with card · ${peso(totalPrice)}`
                                : `Place order · ${peso(totalPrice)}`}
                        </Button>
                    </Paper>
                </Box>
            </Container>

            <Dialog
                open={cardDialogOpen}
                onClose={() => {
                    setCardDialogOpen(false)
                    if (!selectedCard) setMethod('cod')
                }}
                fullWidth
                maxWidth="sm"
            >
                <Box component="form" onSubmit={cardForm.handleSubmit} autoComplete="off">
                    <DialogTitle sx={{ color: GREEN, fontWeight: 700, pb: 0.5 }}>Card details</DialogTitle>
                    <DialogContent sx={{ pt: '12px !important' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                            Choose a saved card or enter a card for this order.
                        </Typography>
                        {savedCards.length > 0 && (
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Saved cards"
                                value={cardForm.values.savedCard}
                                onChange={(event) => {
                                    const saved = savedCards.find((item) => item.id === event.target.value)
                                    cardForm.setFieldValue('savedCard', event.target.value)
                                    if (saved) {
                                        cardForm.setFieldValue('cardholder', saved.cardholder)
                                        cardForm.setFieldValue('expiry', saved.expiry)
                                        cardForm.setFieldValue('cardNumber', '')
                                    } else {
                                        cardForm.setFieldValue('cardholder', '')
                                        cardForm.setFieldValue('expiry', '')
                                    }
                                }}
                                sx={{ mb: 2 }}
                            >
                                <MenuItem value="">Use a different card</MenuItem>
                                {savedCards.map((card) => (
                                    <MenuItem value={card.id} key={card.id}>
                                        {card.cardholder} ···· {card.last4} (expires {card.expiry})
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {!cardForm.values.savedCard && (
                                <TextField
                                    size="small"
                                    fullWidth
                                    label="Card number"
                                    placeholder="1234 5678 9012 3456"
                                    value={cardForm.values.cardNumber}
                                    onChange={changeCardNumber}
                                    onBlur={cardForm.handleBlur}
                                    error={Boolean(cardForm.touched.cardNumber && cardForm.errors.cardNumber)}
                                    helperText={cardForm.touched.cardNumber && cardForm.errors.cardNumber}
                                    inputProps={{ inputMode: 'numeric', autoComplete: 'off' }}
                                />
                            )}
                            {cardForm.values.savedCard && (
                                <Alert severity="info">
                                    Card ending in {savedCards.find((card) => card.id === cardForm.values.savedCard)?.last4}. Enter its security code to continue.
                                </Alert>
                            )}
                            <TextField
                                size="small"
                                fullWidth
                                label="Name on card"
                                name="cardholder"
                                value={cardForm.values.cardholder}
                                onChange={cardForm.handleChange}
                                onBlur={cardForm.handleBlur}
                                error={Boolean(cardForm.touched.cardholder && cardForm.errors.cardholder)}
                                helperText={cardForm.touched.cardholder && cardForm.errors.cardholder}
                                autoComplete="off"
                            />
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <TextField
                                    size="small"
                                    label="Expiry"
                                    name="expiry"
                                    placeholder="MM/YY"
                                    value={cardForm.values.expiry}
                                    onChange={cardForm.handleChange}
                                    onBlur={cardForm.handleBlur}
                                    error={Boolean(cardForm.touched.expiry && cardForm.errors.expiry)}
                                    helperText={cardForm.touched.expiry && cardForm.errors.expiry}
                                    inputProps={{ maxLength: 5, autoComplete: 'off' }}
                                />
                                <TextField
                                    size="small"
                                    label="Security code"
                                    name="cvc"
                                    value={cardForm.values.cvc}
                                    onChange={(event) => cardForm.setFieldValue('cvc', event.target.value.replace(/\D/g, '').slice(0, 4))}
                                    onBlur={cardForm.handleBlur}
                                    error={Boolean(cardForm.touched.cvc && cardForm.errors.cvc)}
                                    helperText={cardForm.touched.cvc && cardForm.errors.cvc}
                                    inputProps={{ inputMode: 'numeric', autoComplete: 'off' }}
                                />
                            </Box>
                            {!cardForm.values.savedCard && (
                                <FormControlLabel
                                    control={<Checkbox name="saveCard" checked={cardForm.values.saveCard} onChange={cardForm.handleChange} sx={{ color: GREEN, '&.Mui-checked': { color: GREEN } }} />}
                                    label={<Typography variant="body2">Save this card on this device</Typography>}
                                />
                            )}
                            <Typography variant="caption" color="text.secondary">
                                Only the cardholder name, last four digits, and expiry are saved. Full card numbers and security codes are not stored.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => {
                            setCardDialogOpen(false)
                            if (!selectedCard) setMethod('cod')
                        }} sx={{ color: GREEN, textTransform: 'none' }}>Cancel</Button>
                        <Button type="submit" variant="contained" disableElevation sx={{ bgcolor: GREEN, borderBottom: `3px solid ${GOLD}`, textTransform: 'none', '&:hover': { bgcolor: GREEN_DARK, color: GOLD } }}>
                            Use this card
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    )
}

export default Payment
