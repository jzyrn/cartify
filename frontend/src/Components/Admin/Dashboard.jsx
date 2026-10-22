import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, Box, Button, Paper, Skeleton, TextField, Typography } from '@mui/material'

import MetaData from '../Layout/MetaData'
import { AdminLayout, cardSx, GREEN, GREEN_DARK, GOLD } from './AdminUI'
import ProductSalesChart from './ProductSalesChart'
import UserSalesChart from './UserSalesChart'
import MonthlySalesChart from './MonthlySalesChart'
import Loader from '../Layout/Loader'

import { getAdminProducts } from '../../actions/productActions'
import { allOrders } from '../../actions/orderActions'
import { allUsers } from '../../actions/userActions'

const peso = (n) =>
    `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const toDateInput = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/* ---------- small building blocks ---------- */

const StatCard = ({ label, value, icon, to, loading, note, noteTone = 'neutral' }) => {
    const tones = {
        neutral: { bg: '#eef3f0', color: GREEN },
        warn: { bg: '#fdecea', color: '#b3261e' },
        good: { bg: '#e6f4ea', color: '#1e7a3c' },
    }
    const t = tones[noteTone]

    return (
        <Paper variant="outlined" sx={cardSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {label}
                </Typography>
                <Box
                    sx={{
                        width: 36, height: 36, borderRadius: 2, bgcolor: '#f7eecb', color: '#8c7418',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <i className={`fa ${icon}`} />
                </Box>
            </Box>

            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5, color: GREEN }}>
                {loading ? <Skeleton width={90} /> : value}
            </Typography>

            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box
                    sx={{
                        px: 1, py: 0.25, borderRadius: 10, fontSize: 12, fontWeight: 600,
                        bgcolor: t.bg, color: t.color, whiteSpace: 'nowrap',
                    }}
                >
                    {note}
                </Box>
                <Typography
                    component={Link}
                    to={to}
                    variant="caption"
                    sx={{ color: GREEN, fontWeight: 600, textDecoration: 'none', '&:hover': { color: GOLD } }}
                >
                    View details →
                </Typography>
            </Box>
        </Paper>
    )
}

const SectionCard = ({ title, subtitle, children }) => (
    <Paper variant="outlined" sx={cardSx}>
        <Typography fontWeight={700} sx={{ color: GREEN }}>
            {title}
        </Typography>
        {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {subtitle}
            </Typography>
        )}
        {children}
    </Paper>
)

/* ---------- page ---------- */

const Dashboard = () => {
    const dispatch = useDispatch()
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date()
        return { startDate: `${today.getFullYear()}-01-01`, endDate: toDateInput(today) }
    })
    const [dateDraft, setDateDraft] = useState(dateRange)
    const [dateRangeError, setDateRangeError] = useState('')

    const { loading: productsLoading, products = [] } = useSelector((state) => state.products)
    const { loading: ordersLoading, orders = [], totalAmount } = useSelector((state) => state.allOrders)
    const { loading: usersLoading, users = [] } = useSelector((state) => state.allUsers)
    const { user } = useSelector((state) => state.auth)
    const dashboardLoading = productsLoading || ordersLoading || usersLoading

    useEffect(() => {
        dispatch(getAdminProducts())
        dispatch(allOrders())
        dispatch(allUsers())
    }, [dispatch])

    if (dashboardLoading) {
        return <Loader />
    }

    const outOfStockList = products.filter((p) => p.stock === 0)
    const revenue = totalAmount ?? orders.reduce((acc, o) => acc + Number(o.totalPrice || 0), 0)
    const firstName = user?.name ? user.name.split(' ')[0] : 'Admin'
    const today = new Date().toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const applyDateRange = () => {
        if (dateDraft.startDate && dateDraft.endDate && dateDraft.startDate > dateDraft.endDate) {
            setDateRangeError('The start date must be before the end date.')
            return
        }
        setDateRangeError('')
        setDateRange({ ...dateDraft })
    }

    const resetDateRange = () => {
        const currentDate = toDateInput(new Date())
        const defaults = { startDate: `${new Date().getFullYear()}-01-01`, endDate: currentDate }
        setDateDraft(defaults)
        setDateRange(defaults)
        setDateRangeError('')
    }

    return (
        <>
            <MetaData title={'Admin Dashboard'} />
            <AdminLayout>
                {/* Welcome banner */}
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,
                        borderBottom: `3px solid ${GOLD}`,
                        borderRadius: 2,
                        p: { xs: 3, md: 4 },
                        color: '#fff',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {today}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>
                            Welcome back, <span style={{ color: GOLD }}>{firstName}</span>
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                            {ordersLoading
                                ? 'Loading your store summary…'
                                : `You have ${orders.length} order${orders.length === 1 ? '' : 's'} and ${peso(revenue)} in revenue so far.`}
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        to="/admin/orders"
                        variant="contained"
                        disableElevation
                        sx={{
                            textTransform: 'none', fontWeight: 700, px: 3,
                            bgcolor: GOLD, color: GREEN_DARK,
                            '&:hover': { bgcolor: '#dbb83a' },
                        }}
                    >
                        View Orders →
                    </Button>
                </Box>

                {/* Stat cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2.5,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                    }}
                >
                    <StatCard
                        label="Total Revenue"
                        value={peso(revenue)}
                        icon="fa-money"
                        to="/admin/orders"
                        loading={ordersLoading}
                        note="All time"
                    />
                    <StatCard
                        label="Orders"
                        value={orders.length}
                        icon="fa-shopping-basket"
                        to="/admin/orders"
                        loading={ordersLoading}
                        note="Total orders"
                    />
                    <StatCard
                        label="Users"
                        value={users.length}
                        icon="fa-users"
                        to="/admin/users"
                        loading={usersLoading}
                        note="Registered"
                    />
                    <StatCard
                        label="Products"
                        value={products.length}
                        icon="fa-cubes"
                        to="/admin/products"
                        loading={productsLoading}
                        note={outOfStockList.length > 0 ? `${outOfStockList.length} out of stock` : 'All in stock'}
                        noteTone={outOfStockList.length > 0 ? 'warn' : 'good'}
                    />
                </Box>

                {/* Date filter for all sales charts */}
                <Paper variant="outlined" sx={{ ...cardSx, p: { xs: 2, md: 2.5 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box>
                            <Typography fontWeight={700} sx={{ color: GREEN }}>Sales date range</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Filter monthly, product, and customer sales charts.
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                            <TextField
                                type="date"
                                label="From"
                                size="small"
                                value={dateDraft.startDate}
                                onChange={(event) => setDateDraft((current) => ({ ...current, startDate: event.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 165 }}
                            />
                            <TextField
                                type="date"
                                label="To"
                                size="small"
                                value={dateDraft.endDate}
                                onChange={(event) => setDateDraft((current) => ({ ...current, endDate: event.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 165 }}
                            />
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={applyDateRange}
                                sx={{ bgcolor: GREEN, borderBottom: `3px solid ${GOLD}`, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: GREEN_DARK, color: GOLD } }}
                            >
                                Apply
                            </Button>
                            <Button
                                variant="text"
                                onClick={resetDateRange}
                                sx={{ color: GREEN, textTransform: 'none', fontWeight: 600 }}
                            >
                                This year
                            </Button>
                        </Box>
                    </Box>
                    {dateRangeError && <Alert severity="error" sx={{ mt: 2 }}>{dateRangeError}</Alert>}
                </Paper>

                {/* Charts row 1 */}
                <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
                    <SectionCard title="Monthly Sales" subtitle="Revenue per month">
                        <MonthlySalesChart startDate={dateRange.startDate} endDate={dateRange.endDate} />
                    </SectionCard>
                    <SectionCard title="Product Sales" subtitle="Share of total sales">
                        <ProductSalesChart startDate={dateRange.startDate} endDate={dateRange.endDate} />
                    </SectionCard>
                </Box>

                {/* Charts row 2 */}
                <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
                    <SectionCard title="Customer Sales" subtitle="Total spent per customer (top customer in gold)">
                        <UserSalesChart startDate={dateRange.startDate} endDate={dateRange.endDate} />
                    </SectionCard>

                    <SectionCard title="Out of Stock" subtitle="Products that need restocking">
                        {productsLoading ? (
                            <Skeleton variant="rounded" height={120} />
                        ) : outOfStockList.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                All products are in stock.
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                {outOfStockList.slice(0, 6).map((p) => (
                                    <Box
                                        key={p._id}
                                        sx={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            gap: 1, py: 1.2, borderBottom: '1px solid #eef3f0',
                                            '&:last-of-type': { borderBottom: 0 },
                                        }}
                                    >
                                        <Typography variant="body2" noWrap sx={{ color: GREEN, fontWeight: 500 }}>
                                            {p.name}
                                        </Typography>
                                        <Typography
                                            component={Link}
                                            to={`/admin/product/${p._id}`}
                                            variant="caption"
                                            sx={{ color: '#8c7418', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', '&:hover': { color: GREEN } }}
                                        >
                                            Restock →
                                        </Typography>
                                    </Box>
                                ))}
                                {outOfStockList.length > 6 && (
                                    <Typography
                                        component={Link}
                                        to="/admin/products"
                                        variant="caption"
                                        sx={{ mt: 1, color: GREEN, fontWeight: 600, textDecoration: 'none' }}
                                    >
                                        +{outOfStockList.length - 6} more
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </SectionCard>
                </Box>
            </AdminLayout>
        </>
    )
}

export default Dashboard
