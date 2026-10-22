import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Chip, Container, Paper, Tab, Tabs, Typography } from '@mui/material'
import AllInboxOutlinedIcon from '@mui/icons-material/AllInboxOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { PageHeader, PageLoader, primaryBtnSx, cardSx } from '../Admin/AdminUI'
import { formatOrderNumber } from '../Cart/checkoutUtils'
import { myOrders, clearErrors } from '../../actions/orderActions'

const statusTone = (status = '') => {
    const normalized = status === 'Preparing' ? 'Processing' : status
    if (normalized === 'Delivered') return 'good'
    if (normalized === 'Shipped') return 'gold'
    if (normalized === 'Processing') return 'processing'
    if (normalized === 'Cancelled') return 'cancelled'
    return 'neutral'
}

const orderStages = [
    { value: 'All', label: 'All orders', Icon: AllInboxOutlinedIcon },
    { value: 'Pending', label: 'To be processed', Icon: PendingActionsOutlinedIcon },
    { value: 'Processing', label: 'Being processed', Icon: AutorenewOutlinedIcon },
    { value: 'Shipped', label: 'Shipped', Icon: LocalShippingOutlinedIcon },
    { value: 'Delivered', label: 'Delivered', Icon: TaskAltOutlinedIcon },
    { value: 'ToRate', label: 'To rate', Icon: RateReviewOutlinedIcon },
    { value: 'Cancelled', label: 'Cancelled', Icon: HighlightOffOutlinedIcon },
]

const emptyStageText = {
    Pending: 'No orders are waiting to be processed.',
    Processing: 'No orders are being processed right now.',
    Shipped: 'No shipped orders yet.',
    Delivered: 'No delivered orders to review yet.',
    Cancelled: 'No cancelled orders.',
}

const ListOrders = () => {
    const dispatch = useDispatch()
    const { loading, error, orders } = useSelector(state => state.myOrders)
    const [activeStage, setActiveStage] = useState('All')

    // fetch once when the page opens
    useEffect(() => {
        dispatch(myOrders())
    }, [dispatch])

    // show + clear errors (separate effect so it never re-triggers the fetch)
    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
    }, [error, dispatch])

    const customerOrders = orders || []
    const normalizedStatus = (status) => status === 'Preparing' ? 'Processing' : status
    const stageCounts = customerOrders.reduce((counts, order) => {
        const status = normalizedStatus(order.orderStatus || 'Pending')
        counts[status] = (counts[status] || 0) + 1
        return counts
    }, {})
    stageCounts.ToRate = customerOrders
        .filter(order => normalizedStatus(order.orderStatus || 'Pending') === 'Delivered')
        .reduce((count, order) => count + (order.orderItems || []).length, 0)
    const visibleOrders = activeStage === 'All'
        ? customerOrders
        : customerOrders.filter(order => normalizedStatus(order.orderStatus || 'Pending') === (activeStage === 'ToRate' ? 'Delivered' : activeStage))
    const formatDate = (date) => date
        ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Date unavailable'

    return (
        <>
            <MetaData title={'My Purchase History'} />
            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <PageHeader
                    title="My Purchase History"
                    subtitle={`${customerOrders.length} order${customerOrders.length === 1 ? '' : 's'} · Track each order and review products after delivery.`}
                />

                {loading ? (
                    <PageLoader />
                ) : customerOrders.length === 0 ? (
                    <Paper variant="outlined" sx={{ ...cardSx, textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            You haven't placed any orders yet
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            When you do, they will show up here.
                        </Typography>
                        <Button component={Link} to="/" disableElevation sx={primaryBtnSx}>
                            Start shopping
                        </Button>
                    </Paper>
                ) : (
                    <>
                    <Paper variant="outlined" sx={{ ...cardSx, px: { xs: 1, sm: 2 }, py: 0.5, overflow: 'hidden' }}>
                        <Tabs
                            value={activeStage}
                            onChange={(_, value) => setActiveStage(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            aria-label="Filter purchase history by order status"
                            sx={{
                                minHeight: 54,
                                '& .MuiTabs-indicator': { backgroundColor: '#c9a227', height: 3 },
                                '& .MuiTab-root': { minHeight: 54, textTransform: 'none', color: '#64736c', fontWeight: 600, px: 1.5 },
                                '& .Mui-selected': { color: '#1a3329 !important' },
                            }}
                        >
                            {orderStages.map(stage => (
                                <Tab
                                    key={stage.value}
                                    value={stage.value}
                                    label={
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                                            <stage.Icon sx={{ fontSize: 18, color: activeStage === stage.value ? '#1a3329' : '#718078' }} />
                                            <span>{stage.label}</span>
                                            <Chip
                                                label={stage.value === 'All' ? customerOrders.length : stageCounts[stage.value] || 0}
                                                size="small"
                                                sx={{ height: 20, minWidth: 22, '& .MuiChip-label': { px: 0.7 }, bgcolor: activeStage === stage.value ? '#e7eee9' : '#f1f4f2', color: '#1a3329', fontSize: '0.72rem', fontWeight: 700 }}
                                            />
                                        </Box>
                                    }
                                />
                            ))}
                        </Tabs>
                    </Paper>

                    {visibleOrders.length === 0 ? (
                        <Paper variant="outlined" sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                {activeStage === 'All' ? 'No orders to show' : orderStages.find(stage => stage.value === activeStage)?.label}
                            </Typography>
                            <Typography color="text.secondary">
                                {emptyStageText[activeStage] || 'Orders will appear here when they are placed.'}
                            </Typography>
                        </Paper>
                    ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {visibleOrders.map((order) => {
                            const items = order.orderItems || []
                            const status = order.orderStatus || 'Pending'
                            const tone = statusTone(status)
                            const statusColor = tone === 'good' ? 'success' : tone === 'gold' ? 'warning' : tone === 'cancelled' ? 'error' : tone === 'processing' ? 'info' : 'default'

                            return (
                                <Paper key={order._id} variant="outlined" sx={{ ...cardSx, p: { xs: 2, sm: 2.5 } }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="overline" color="text.secondary">Order placed {formatDate(order.createdAt)}</Typography>
                                            <Typography variant="subtitle1" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>
                                                {formatOrderNumber(order)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {items.length} item{items.length === 1 ? '' : 's'}
                                                {items.length > 0 ? ` · ${items.slice(0, 2).map((item) => item.name).join(', ')}${items.length > 2 ? ` and ${items.length - 2} more` : ''}` : ''}
                                            </Typography>
                                            {normalizedStatus(status) === 'Delivered' && activeStage === 'ToRate' && items.length > 0 && (
                                                <Box sx={{ mt: 1.25, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 0.25 }}>Rate or update a review:</Typography>
                                                    {items.map((item, index) => (
                                                        <Button
                                                            key={`${item.product}-${index}`}
                                                            component={Link}
                                                            to={`/product/${item.product}#reviews`}
                                                            size="small"
                                                            sx={{ minWidth: 0, px: 1, py: 0.25, color: '#1a3329', bgcolor: '#f1f5f2', textTransform: 'none', fontSize: '0.75rem', '&:hover': { bgcolor: '#e5eee8' } }}
                                                        >
                                                            {item.name}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
                                                <Typography fontWeight={700}>₱{Number(order.totalPrice || 0).toLocaleString()}</Typography>
                                            </Box>
                                            <Chip label={normalizedStatus(status)} color={statusColor} size="small" />
                                            <Button component={Link} to={`/order/${order._id}`} variant="outlined" size="small" sx={{ borderColor: '#1a3329', color: '#1a3329', textTransform: 'none', fontWeight: 600 }}>
                                                View order
                                            </Button>
                                        </Box>
                                    </Box>
                                </Paper>
                            )
                        })}
                    </Box>
                    )}
                    </>
                )}
            </Container>
        </>
    )
}

export default ListOrders
