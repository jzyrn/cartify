import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box, Collapse, Typography } from '@mui/material'

const GREEN = '#17332a'
const GREEN_DARK = '#0f241d'
const GOLD = '#c9a227'

const itemSx = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    width: '100%',
    px: 1.5,
    py: 1.1,
    border: 0,
    borderRadius: 2,
    font: 'inherit',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
    color: active ? GOLD : 'rgba(255,255,255,0.78)',
    bgcolor: active ? 'rgba(201,162,39,0.14)' : 'transparent',
    transition: 'background-color .15s, color .15s',
    '&:hover': {
        bgcolor: active ? 'rgba(201,162,39,0.18)' : 'rgba(255,255,255,0.06)',
        color: active ? GOLD : '#fff',
    },
})

const Ico = ({ name }) => (
    <i className={`fa ${name}`} style={{ width: 18, textAlign: 'center', fontSize: 15 }} />
)

const Sidebar = () => {
    const { pathname } = useLocation()
    const productsActive = pathname.startsWith('/admin/product')
    const [open, setOpen] = useState(productsActive)

    return (
        <Box
            component="nav"
            id="sidebar"
            sx={{
                bgcolor: GREEN,
                borderBottom: `3px solid ${GOLD}`,
                borderRadius: 3,
                p: 2,
                mt: 2,
                mb: 2,
                flex: 1,                      // grows to fill the column, so no white gap below
                minHeight: { md: '78vh' },
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5, pb: 2, mb: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Box
                    sx={{
                        width: 34, height: 34, borderRadius: 2, bgcolor: GOLD, color: GREEN_DARK,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                    }}
                >
                    C
                </Box>
                <Box>
                    <Typography sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>Cartify</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Admin Panel</Typography>
                </Box>
            </Box>

            <Typography sx={{ color: 'rgba(201,162,39,0.8)', fontSize: 11, fontWeight: 700, letterSpacing: 1, px: 1.5, mb: 1 }}>
                MENU
            </Typography>

            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <li>
                    <Box component={Link} to="/dashboard" sx={itemSx(pathname === '/dashboard')}>
                        <Ico name="fa-tachometer" /> Dashboard
                    </Box>
                </li>

                <li>
                    <Box component="button" type="button" onClick={() => setOpen(!open)} sx={itemSx(productsActive)}>
                        <Ico name="fa-product-hunt" />
                        <span style={{ flex: 1 }}>Products</span>
                        <i
                            className="fa fa-angle-down"
                            style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
                        />
                    </Box>
                    <Collapse in={open} unmountOnExit>
                        <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 0.5, p: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <li>
                                <Box component={Link} to="/admin/products" sx={itemSx(pathname === '/admin/products')}>
                                    <Ico name="fa-clipboard" /> All
                                </Box>
                            </li>
                            <li>
                                <Box component={Link} to="/admin/product" sx={itemSx(pathname === '/admin/product')}>
                                    <Ico name="fa-plus" /> Create
                                </Box>
                            </li>
                        </Box>
                    </Collapse>
                </li>

                <li>
                    <Box component={Link} to="/admin/orders" sx={itemSx(pathname.startsWith('/admin/order'))}>
                        <Ico name="fa-shopping-basket" /> Orders
                    </Box>
                </li>

                <li>
                    <Box component={Link} to="/admin/users" sx={itemSx(pathname.startsWith('/admin/user'))}>
                        <Ico name="fa-users" /> Users
                    </Box>
                </li>

                <li>
                    <Box component={Link} to="/admin/reviews" sx={itemSx(pathname.startsWith('/admin/reviews'))}>
                        <Ico name="fa-star" /> Reviews
                    </Box>
                </li>
            </Box>

            <Box sx={{ mt: 'auto', pt: 3 }}>
                <Box component={Link} to="/" sx={{ ...itemSx(false), borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, pt: 2 }}>
                    <Ico name="fa-arrow-left" /> Back to store
                </Box>
            </Box>
        </Box>
    )
}

export default Sidebar