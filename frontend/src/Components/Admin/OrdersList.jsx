import React, { useEffect } from 'react'
import { Box, Paper } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { AdminLayout, PageHeader, PageLoader, IconAction, StatusPill, cardSx, dataGridSx, gridProps, idCellSx } from './AdminUI'
import { allOrders, clearErrors, deleteOrder } from '../../actions/orderActions'
import { DELETE_ORDER_RESET } from '../../constants/orderConstants'

const statusTone = (status = '') => {
    if (String(status).includes('Delivered')) return 'good'
    if (String(status).includes('Shipped')) return 'gold'
    return 'neutral'
}

const OrdersList = () => {
    const dispatch = useDispatch()
    const { loading, error, orders } = useSelector(state => state.allOrders)
    const { isDeleted, loading: deleting } = useSelector(state => state.order)

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-right' })
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-right' })

    useEffect(() => {
        dispatch(allOrders())
        if (error) {
            errMsg(error)
            dispatch(clearErrors())
        }
        if (isDeleted) {
            successMsg('Order deleted successfully')
            dispatch({ type: DELETE_ORDER_RESET })
        }
    }, [error, isDeleted])

    const deleteOrderHandler = (id) => {
        dispatch(deleteOrder(id))
    }

    const columns = [
        {
            field: 'id',
            headerName: 'Order ID',
            flex: 1.2,
            minWidth: 220,
            renderCell: (params) => <Box component="span" sx={idCellSx}>{params.value}</Box>,
        },
        { field: 'customer', headerName: 'Customer', flex: 0.8, minWidth: 160 },
        { field: 'numofItems', headerName: 'Items', width: 100, align: 'right', headerAlign: 'right' },
        { field: 'amount', headerName: 'Amount', width: 140, align: 'right', headerAlign: 'right' },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (params) => <StatusPill label={params.value === 'Preparing' ? 'Processing' : params.value} tone={statusTone(params.value)} />,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 110,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconAction to={`/admin/order/${params.id}`} icon="fa-eye" title="View / process" />
                    <IconAction onClick={() => deleteOrderHandler(params.id)} icon="fa-trash" title="Delete" tone="danger" loading={deleting} />
                </Box>
            ),
        },
    ]

    const rows = orders.map(order => ({
        id: order._id,
        customer: order.user?.name || 'Customer unavailable',
        numofItems: order.orderItems.length,
        amount: `₱${order.totalPrice}`,
        status: order.orderStatus,
    }))

    return (
        <>
            <MetaData title={'All Orders'} />
            <AdminLayout>
                <PageHeader title="All Orders" subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'} placed`} />
                <Paper variant="outlined" sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <PageLoader />
                    ) : (
                        <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} sx={dataGridSx} {...gridProps} />
                    )}
                </Paper>
            </AdminLayout>
        </>
    )
}

export default OrdersList
