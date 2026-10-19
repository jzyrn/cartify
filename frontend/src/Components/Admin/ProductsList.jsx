import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Paper } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { AdminLayout, PageHeader, PageLoader, IconAction, StatusPill, primaryBtnSx, cardSx, dataGridSx, gridProps, idCellSx } from './AdminUI'
import { getAdminProducts, deleteProduct, clearErrors } from '../../actions/productActions'
import { DELETE_PRODUCT_RESET } from '../../constants/productConstants'

const ProductsList = () => {
    const dispatch = useDispatch()
    const { loading, error, products } = useSelector(state => state.products)
    const { error: deleteError, isDeleted } = useSelector(state => state.product)

    // checkbox selection (DataGrid v8 keeps it as { type, ids })
    const [selection, setSelection] = useState({ type: 'include', ids: new Set() })

    const deleteProductHandler = (id) => {
        dispatch(deleteProduct(id))
    }

    useEffect(() => {
        dispatch(getAdminProducts())

        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }

        if (deleteError) {
            toast.error(deleteError, { position: 'bottom-right' })
            dispatch(clearErrors())
        }

        if (isDeleted) {
            toast.success('Product deleted successfully', { position: 'bottom-right' })
            dispatch({ type: DELETE_PRODUCT_RESET })
        }
    }, [error, deleteError])

    const rows = products.map(product => ({
        id: product._id,
        image: product.images?.[0]?.url,
        name: product.name,
        brand: product.brand || '—',
        price: `₱${product.price}`,
        stock: product.stock,
    }))

    // the ids of the ticked rows (also works when "select all" is used across pages)
    const selectedIds =
        selection.type === 'exclude'
            ? rows.map(r => r.id).filter(id => !selection.ids.has(id))
            : Array.from(selection.ids)

    const bulkDeleteHandler = async () => {
        if (selectedIds.length === 0) return
        if (!window.confirm(`Delete ${selectedIds.length} selected product${selectedIds.length === 1 ? '' : 's'}?`)) return

        await Promise.all(selectedIds.map(id => dispatch(deleteProduct(id))))

        toast.success(`${selectedIds.length} product${selectedIds.length === 1 ? '' : 's'} deleted successfully`, { position: 'bottom-right' })
        setSelection({ type: 'include', ids: new Set() })
        dispatch({ type: DELETE_PRODUCT_RESET })
        dispatch(getAdminProducts())
    }

    const columns = [
        {
            field: 'id',
            headerName: 'Product ID',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => <Box component="span" sx={idCellSx}>{params.value}</Box>,
        },
        {
            field: 'image',
            headerName: 'Image',
            width: 90,
            sortable: false,
            filterable: false,
            renderCell: (params) =>
                params.value ? (
                    <Box
                        component="img"
                        src={params.value}
                        alt="product"
                        sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, border: '1px solid #e3e9e5' }}
                    />
                ) : (
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#eef3f0' }} />
                ),
        },
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
        { field: 'brand', headerName: 'Brand', width: 160 },
        { field: 'price', headerName: 'Price', width: 120, align: 'right', headerAlign: 'right' },
        {
            field: 'stock',
            headerName: 'Stock',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) =>
                params.value === 0 ? <StatusPill label="Out of stock" tone="danger" /> : params.value,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 110,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconAction to={`/admin/product/${params.id}`} icon="fa-pencil" title="Edit" />
                    <IconAction onClick={() => deleteProductHandler(params.id)} icon="fa-trash" title="Delete" tone="danger" />
                </Box>
            ),
        },
    ]

    return (
        <>
            <MetaData title={'All Products'} />
            <AdminLayout>
                <PageHeader
                    title="All Products"
                    subtitle={`${products.length} product${products.length === 1 ? '' : 's'} in your store`}
                    action={
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            {selectedIds.length > 0 && (
                                <Button
                                    onClick={bulkDeleteHandler}
                                    variant="contained"
                                    color="error"
                                    disableElevation
                                    sx={{ textTransform: 'none', fontWeight: 700 }}
                                >
                                    Delete selected ({selectedIds.length})
                                </Button>
                            )}
                            <Button component={Link} to="/admin/product" disableElevation sx={primaryBtnSx}>+ New Product</Button>
                        </Box>
                    }
                />
                <Paper variant="outlined" sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <PageLoader />
                    ) : (
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(row) => row.id}
                            sx={dataGridSx}
                            {...gridProps}
                            checkboxSelection
                            disableRowSelectionOnClick
                            rowSelectionModel={selection}
                            onRowSelectionModelChange={(model) => setSelection(model)}
                        />
                    )}
                </Paper>
            </AdminLayout>
        </>
    )
}

export default ProductsList