import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Paper, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Swal from 'sweetalert2'
import axios from 'axios'
import { toast } from 'react-toastify'

import MetaData from '../Layout/MetaData'
import { AdminLayout, PageHeader, IconAction, cardSx, dataGridSx, gridProps, idCellSx } from './AdminUI'

const ProductReviews = () => {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const initialLoadStarted = useRef(false)

    const loadReviews = useCallback(async () => {
        setLoading(true)
        setLoadError('')
        try {
            // Reviews are embedded in product documents, so reuse the existing
            // authenticated admin-products endpoint and flatten them for the table.
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/products`, {
                withCredentials: true,
            })
            const allReviews = (data.products || []).flatMap((product) =>
                (product.reviews || []).map((review) => ({
                    ...review,
                    productId: product._id,
                    productName: product.name,
                }))
            )
            setReviews(allReviews)
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Could not load product reviews.'
            setLoadError(message)
            toast.error(message, { position: 'bottom-right', toastId: 'admin-product-reviews-load' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (initialLoadStarted.current) return
        initialLoadStarted.current = true
        loadReviews()
    }, [loadReviews])

    const deleteReview = async (reviewId, productId) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API}/reviews?id=${reviewId}&productId=${productId}`,
                { withCredentials: true }
            )
            toast.success('Review deleted successfully', { position: 'bottom-right' })
            await loadReviews()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Could not delete the review.', { position: 'bottom-right' })
        }
    }

    const confirmDelete = (reviewId, productId) => {
        Swal.fire({
            title: 'Delete review?',
            text: 'This review will be removed from the product.',
            icon: 'warning',
            confirmButtonText: 'Delete',
            confirmButtonColor: '#17332a',
            showCancelButton: true,
        }).then((result) => {
            if (result.isConfirmed) deleteReview(reviewId, productId)
        })
    }

    const columns = [
        {
            field: 'productName',
            headerName: 'Product',
            flex: 1,
            minWidth: 180,
        },
        {
            field: 'rating',
            headerName: 'Rating',
            width: 100,
            renderCell: (params) => <Box component="span" sx={{ color: '#8c7418', fontWeight: 700 }}>{params.value} ★</Box>,
        },
        { field: 'comment', headerName: 'Review', flex: 2, minWidth: 240 },
        { field: 'name', headerName: 'Customer', flex: 1, minWidth: 140 },
        {
            field: 'productId',
            headerName: 'Product ID',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => <Box component="span" sx={idCellSx}>{params.value}</Box>,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 90,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <IconAction
                    onClick={() => confirmDelete(params.row.id, params.row.productId)}
                    icon="fa-trash"
                    title="Delete review"
                    tone="danger"
                />
            ),
        },
    ]

    const rows = reviews.map((review) => ({
        id: review._id,
        productId: review.productId,
        productName: review.productName,
        rating: review.rating,
        comment: review.comment,
        name: review.name,
    }))

    return (
        <>
            <MetaData title="Product Reviews" />
            <AdminLayout>
                <PageHeader title="Product Reviews" subtitle={`${rows.length} customer review${rows.length === 1 ? '' : 's'}`} />
                {loadError && (
                    <Alert
                        severity="error"
                        action={<Button color="inherit" size="small" onClick={loadReviews}>Retry</Button>}
                    >
                        {loadError}
                    </Alert>
                )}
                <Paper variant="outlined" sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ p: 5, textAlign: 'center' }}>
                            <Typography color="text.secondary">Loading reviews…</Typography>
                        </Box>
                    ) : rows.length > 0 ? (
                        <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} sx={dataGridSx} {...gridProps} />
                    ) : (
                        <Box sx={{ p: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary">No reviews have been submitted yet.</Typography>
                        </Box>
                    )}
                </Paper>
            </AdminLayout>
        </>
    )
}

export default ProductReviews
