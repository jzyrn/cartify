import React, { useState, useEffect, useRef } from 'react'
import { useFormik } from 'formik'
import { useParams, useNavigate } from 'react-router-dom'
import { Autocomplete, Box, Button, CircularProgress, MenuItem, Paper, TextField, Typography } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { AdminLayout, PageHeader, primaryBtnSx, fieldSx, cardSx, GREEN, GOLD } from './AdminUI'
import { updateProduct, getProductDetails, getAdminProducts, clearErrors } from '../../actions/productActions'
import { UPDATE_PRODUCT_RESET } from '../../constants/productConstants'
import { productSchema } from '../../validation/schemas'

const categories = [
    'Foundation',
    'Concealer',
    'Powder',
    'Blush & Highlighter',
    'Eyeshadow',
    'Eyeliner & Mascara',
    'Lipstick & Lip Tint',
    'Brows'
]

const thumbSx = { width: 72, height: 72, objectFit: 'cover', borderRadius: 2, border: '1px solid #e3e9e5' }

const UpdateProduct = () => {
    const dispatch = useDispatch()
    const { error, product } = useSelector(state => state.productDetails)
    const { loading, error: updateError, isUpdated } = useSelector(state => state.product)
    const { products = [] } = useSelector(state => state.products)

    // brand options come from the products that already exist
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort()

    // becomes true once the seller is typed by hand, so the brand stops overwriting it
    const sellerEdited = useRef(false)

    const [images, setImages] = useState([])
    const [oldImages, setOldImages] = useState([])
    const [imagesPreview, setImagesPreview] = useState([])

    let { id } = useParams()
    let navigate = useNavigate()

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-right' })
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-right' })

    const formik = useFormik({
        initialValues: {
            name: product?.name || '',
            price: product?.price ?? '',
            description: product?.description || '',
            category: product?.category || '',
            stock: product?.stock ?? '',
            brand: product?.brand || '',
            // the seller defaults to the product's brand
            seller: product?.brand || product?.seller || '',
        },
        enableReinitialize: true,
        validationSchema: productSchema,
        onSubmit: (values) => {
            const formData = new FormData()
            Object.entries(values).forEach(([key, value]) => formData.set(key, value))
            images.forEach(image => {
                formData.append('images', image)
            })
            dispatch(updateProduct(product._id, formData))
        },
    })

    const onChange = e => {
        const files = Array.from(e.target.files)
        setImagesPreview([])
        setImages([])
        setOldImages([])
        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagesPreview(oldArray => [...oldArray, reader.result])
                    setImages(oldArray => [...oldArray, reader.result])
                }
            }
            reader.readAsDataURL(file)
        })
    }

    useEffect(() => {
        dispatch(getAdminProducts())
    }, [dispatch])

    useEffect(() => {
        if (product && product._id !== id) {
            dispatch(getProductDetails(id))
        } else if (product) {
            setOldImages(product.images)
        }
        if (error) {
            errMsg(error)
            dispatch(clearErrors())
        }
        if (updateError) {
            errMsg(updateError)
            dispatch(clearErrors())
        }
    }, [error, updateError, product, id])

    // runs once the update finished: success message, reset the flag, back to the list
    useEffect(() => {
        if (isUpdated) {
            successMsg('Product updated successfully')
            dispatch({ type: UPDATE_PRODUCT_RESET })
            navigate('/admin/products')
        }
    }, [isUpdated])

    return (
        <>
            <MetaData title={'Update Product'} />
            <AdminLayout>
                <PageHeader title="Update Product" subtitle="Edit the details of this product" />

                <Paper
                    variant="outlined"
                    component="form"
                    onSubmit={formik.handleSubmit}
                    encType="multipart/form-data"
                    sx={{ ...cardSx, maxWidth: 760, width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
                >
                    <TextField id="name_field" label="Name" {...formik.getFieldProps('name')} error={formik.touched.name && Boolean(formik.errors.name)} helperText={formik.touched.name && formik.errors.name} fullWidth sx={fieldSx} />

                    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                        <TextField id="price_field" label="Price (₱)" type="number" {...formik.getFieldProps('price')} error={formik.touched.price && Boolean(formik.errors.price)} helperText={formik.touched.price && formik.errors.price} sx={fieldSx} />
                        <TextField id="stock_field" label="Stock" type="number" {...formik.getFieldProps('stock')} error={formik.touched.stock && Boolean(formik.errors.stock)} helperText={formik.touched.stock && formik.errors.stock} sx={fieldSx} />
                    </Box>

                    <TextField
                        id="description_field"
                        label="Description"
                        multiline
                        minRows={5}
                        {...formik.getFieldProps('description')}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                        fullWidth
                        sx={fieldSx}
                    />

                    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                        <TextField
                            id="category_field"
                            label="Category"
                            select
                            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                            {...formik.getFieldProps('category')}
                            error={formik.touched.category && Boolean(formik.errors.category)}
                            helperText={formik.touched.category && formik.errors.category}
                            sx={fieldSx}
                        >
                            <MenuItem value="" disabled>Select a category</MenuItem>
                            {categories.map(category => (
                                <MenuItem key={category} value={category}>{category}</MenuItem>
                            ))}
                        </TextField>

                        {/* picking a brand also fills the seller, unless the seller was typed by hand */}
                        <Autocomplete
                            freeSolo
                            options={brands}
                            inputValue={formik.values.brand}
                            onInputChange={(e, value) => {
                                formik.setFieldValue('brand', value)
                                if (!sellerEdited.current) formik.setFieldValue('seller', value)
                            }}
                            renderInput={(params) => (
                                <TextField {...params} id="brand_field" label="Brand" sx={fieldSx} />
                            )}
                        />
                    </Box>

                    <TextField
                        id="seller_field"
                        label="Seller Name"
                        {...formik.getFieldProps('seller')}
                        onChange={(e) => {
                            sellerEdited.current = true
                            formik.handleChange(e)
                        }}
                        error={formik.touched.seller && Boolean(formik.errors.seller)}
                        helperText={formik.touched.seller && formik.errors.seller}
                        fullWidth
                        sx={fieldSx}
                    />

                    <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ color: GREEN, mb: 1 }}>Images</Typography>
                        <Button
                            component="label"
                            variant="outlined"
                            sx={{ textTransform: 'none', borderColor: GREEN, color: GREEN, '&:hover': { borderColor: GOLD, bgcolor: '#f7eecb' } }}
                        >
                            Choose Images
                            <input type="file" name="images" id="customFile" hidden multiple onChange={onChange} />
                        </Button>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                            {oldImages && oldImages.map(img => (
                                <Box key={img.url || img} component="img" src={img.url} alt={img.url} sx={thumbSx} />
                            ))}
                            {imagesPreview.map(img => (
                                <Box key={img} component="img" src={img} alt="Images Preview" sx={thumbSx} />
                            ))}
                        </Box>
                    </Box>

                    <Button type="submit" fullWidth size="large" disableElevation disabled={Boolean(loading)} sx={primaryBtnSx}>
                        {loading ? (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                                <CircularProgress size={18} sx={{ color: GOLD }} />
                                Updating...
                            </Box>
                        ) : (
                            'Update'
                        )}
                    </Button>
                </Paper>
            </AdminLayout>
        </>
    )
}

export default UpdateProduct