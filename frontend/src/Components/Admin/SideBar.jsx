import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, Collapse, Typography } from '@mui/material'

const GREEN = '#17332a'
const GREEN_DARK = '#0f241d'
const GOLD = '#c9a227'

/* one row in the menu; active rows get a gold bar on the left edge */
const itemSx = (active) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    width: '100%',
    px: 2,
    py: 1.2,
    border: 0,
    borderRadius: 0,
    font: 'inherit',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
    color: active ? GOLD : 'rgba(255,255,255,0.75)',
    bgcolor: active ? 'rgba(201,162,39,0.12)' : 'transparent',
    transition: 'background-color .15s, color .15s',
    '&::before': {
        content: '""',
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        bgcolor: active ? GOLD : 'transparent',
    },
    '&:hover': {
        bgcolor: active ? 'rgba(201,162,39,0.16)' : 'rgba(255,255,255,0.05)',
        color: active ? GOLD : '#fff',
    },
})

const subItemSx = (active) => ({
    ...itemSx(active),
    pl: 6.5,
    py: 0.9,
    fontSize: 13.5,
})

const Ico = ({ name }) => (
    <i className={`fa ${name}`} style={{ width: 18, textAlign: 'center', fontSize: 15 }} />
)

const GroupLabel = ({ children }) => (
    <Typography
        sx={{ color: 'rgba(201,162,39,0.85)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, px: 2.5, pt: 2.5, pb: 0.8 }}
    >
        {children}
    </Typography>
)

const Group = ({ label, children }) => (
    <Box component="section">
        <GroupLabel>{label}</GroupLabel>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {children}
        </Box>
    </Box>
)

const Sidebar = () => {
    const { pathname } = useLocation()
    const { user } = useSelector((state) => state.auth)

    const productsActive = pathname.startsWith('/admin/product')
    const [open, setOpen] = useState(productsActive)

    const initial = (user?.name || 'A').charAt(0).toUpperCase()

    return (
        <Box
            component="nav"
            id="sidebar"
            sx={{
                width: { xs: '100%', md: 250 },
                flexShrink: 0,
                bgcolor: GREEN,
                borderRight: { md: `3px solid ${GOLD}` },
                borderBottom: { xs: `3px solid ${GOLD}`, md: 0 },
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* sticky inner panel: stays in view while the page scrolls */}
            <Box
                sx={{
                    position: { md: 'sticky' },
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: { md: 'calc(100vh - 137px)' },
                    maxHeight: { md: '100vh' },
                    overflowY: 'auto',
                }}
            >
                {/* Brand */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box
                        sx={{
                            width: 36, height: 36, borderRadius: 2, bgcolor: GOLD, color: GREEN_DARK,
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

                <Group label="OVERVIEW">
                    <li>
                        <Box component={Link} to="/dashboard" sx={itemSx(pathname === '/dashboard')}>
                            <Ico name="fa-tachometer" /> Dashboard
                        </Box>
                    </li>
                </Group>

                <Group label="CATALOG">
                    <li>
                        <Box component="button" type="button" onClick={() => setOpen(!open)} sx={itemSx(productsActive)}>
                            <Ico name="fa-cubes" />
                            <span style={{ flex: 1 }}>Products</span>
                            <i
                                className="fa fa-angle-down"
                                style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
                            />
                        </Box>
                        <Collapse in={open} unmountOnExit>
                            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                                <li>
                                    <Box component={Link} to="/admin/products" sx={subItemSx(pathname === '/admin/products')}>
                                        All products
                                    </Box>
                                </li>
                                <li>
                                    <Box component={Link} to="/admin/product" sx={subItemSx(pathname === '/admin/product')}>
                                        Create product
                                    </Box>
                                </li>
                            </Box>
                        </Collapse>
                    </li>
                    <li>
                        <Box component={Link} to="/admin/reviews" sx={itemSx(pathname.startsWith('/admin/reviews'))}>
                            <Ico name="fa-star" /> Reviews
                        </Box>
                    </li>
                </Group>

                <Group label="SALES">
                    <li>
                        <Box component={Link} to="/admin/orders" sx={itemSx(pathname.startsWith('/admin/order'))}>
                            <Ico name="fa-shopping-basket" /> Orders
                        </Box>
                    </li>
                </Group>

                <Group label="CUSTOMERS">
                    <li>
                        <Box component={Link} to="/admin/users" sx={itemSx(pathname.startsWith('/admin/user'))}>
                            <Ico name="fa-users" /> Users
                        </Box>
                    </li>
                </Group>

                {/* Footer: signed-in admin + way back to the shop */}
                <Box sx={{ mt: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2 }}>
                        <Box
                            sx={{
                                width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(201,162,39,0.18)', color: GOLD,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14,
                            }}
                        >
                            {initial}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ color: '#fff', fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.name || 'Admin'}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Administrator</Typography>
                        </Box>
                    </Box>
                    <Box component={Link} to="/" sx={{ ...itemSx(false), borderTop: '1px solid rgba(255,255,255,0.08)', py: 1.6 }}>
                        <Ico name="fa-arrow-left" /> Back to store
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default Sidebar