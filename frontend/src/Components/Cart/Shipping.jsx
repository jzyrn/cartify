import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Container, Paper, TextField, Typography } from '@mui/material'

import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { saveShippingInfo } from '../../actions/cartActions'
import { GREEN, GREEN_DARK, GOLD } from './checkoutUtils'

// keeps the inputs in the site's green instead of the default blue
const fieldSx = {
    '& label.Mui-focused': { color: GREEN },
    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: GREEN },
}

const Shipping = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { cartItems, shippingInfo } = useSelector((state) => state.cart)

    const [form, setForm] = useState({
        address: shippingInfo?.address || '',
        city: shippingInfo?.city || '',
        postalCode: shippingInfo?.postalCode || '',
        phoneNo: shippingInfo?.phoneNo || '',
        country: shippingInfo?.country || 'PH',
    })
    const [errors, setErrors] = useState({})

    // nothing to check out
    useEffect(() => {
        if (cartItems.length === 0) navigate('/cart', { replace: true })
    }, [cartItems.length, navigate])

    const change = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
    }

    const validate = () => {
        const next = {}
        if (!form.address.trim()) next.address = 'Enter your street address'
        if (!form.city.trim()) next.city = 'Enter your city'
        if (!/^\d{4}$/.test(form.postalCode.trim())) next.postalCode = 'Enter a 4-digit postal code'
        if (!/^(09\d{9}|\+639\d{9})$/.test(form.phoneNo.replace(/[\s-]/g, ''))) {
            next.phoneNo = 'Enter a mobile number like 09181234567'
        }
        if (!form.country.trim()) next.country = 'Enter your country'
        return next
    }

    const submitHandler = (e) => {
        e.preventDefault()
        const next = validate()
        setErrors(next)
        if (Object.keys(next).length > 0) return

        dispatch(saveShippingInfo({
            address: form.address.trim(),
            city: form.city.trim(),
            postalCode: form.postalCode.trim(),
            phoneNo: form.phoneNo.replace(/[\s-]/g, ''),
            country: form.country.trim(),
        }))
        navigate('/confirm')
    }

    return (
        <>
            <MetaData title="Shipping" />
            <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
                <CheckoutSteps activeStep={0} />

                <Paper variant="outlined" sx={{ borderRadius: 2, p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: GREEN }}>
                        Delivery address
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                        Add the details for where you want your order delivered.
                    </Typography>

                    <Box component="form" onSubmit={submitHandler} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            id="address_field"
                            label="Street address"
                            placeholder="House number, street, barangay"
                            value={form.address}
                            onChange={change('address')}
                            error={Boolean(errors.address)}
                            helperText={errors.address}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                id="city_field"
                                label="City"
                                value={form.city}
                                onChange={change('city')}
                                error={Boolean(errors.city)}
                                helperText={errors.city}
                                fullWidth
                                size="small"
                                sx={fieldSx}
                            />
                            <TextField
                                id="postal_code_field"
                                label="Postal code"
                                value={form.postalCode}
                                onChange={change('postalCode')}
                                error={Boolean(errors.postalCode)}
                                helperText={errors.postalCode}
                                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }}
                                fullWidth
                                size="small"
                                sx={fieldSx}
                            />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                id="country_field"
                                label="Country"
                                value={form.country}
                                onChange={change('country')}
                                error={Boolean(errors.country)}
                                helperText={errors.country}
                                fullWidth
                                size="small"
                                sx={fieldSx}
                            />
                            <TextField
                                id="phone_field"
                                label="Mobile number"
                                placeholder="09181234567"
                                value={form.phoneNo}
                                onChange={change('phoneNo')}
                                error={Boolean(errors.phoneNo)}
                                helperText={errors.phoneNo}
                                slotProps={{ htmlInput: { inputMode: 'tel' } }}
                                fullWidth
                                size="small"
                                sx={fieldSx}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                            <Button
                                component={Link}
                                to="/cart"
                                variant="outlined"
                                sx={{ textTransform: 'none', fontWeight: 600, color: GREEN, borderColor: '#d9d7d2', '&:hover': { borderColor: GREEN } }}
                            >
                                Back to cart
                            </Button>
                            <Button
                                id="shipping_btn"
                                type="submit"
                                variant="contained"
                                disableElevation
                                fullWidth
                                size="large"
                                sx={{
                                    py: 1.15,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: 1.5,
                                    bgcolor: GREEN,
                                    borderBottom: `3px solid ${GOLD}`,
                                    '&:hover': { bgcolor: GREEN_DARK, color: GOLD },
                                }}
                            >
                                Continue to confirm
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </>
    )
}

export default Shipping
