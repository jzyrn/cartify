import axios from 'axios';
import {
    ALL_PRODUCTS_REQUEST,
    ALL_PRODUCTS_SUCCESS,
    ALL_PRODUCTS_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    ADMIN_PRODUCTS_REQUEST,
    ADMIN_PRODUCTS_SUCCESS,
    ADMIN_PRODUCTS_FAIL,
    NEW_PRODUCT_REQUEST,
    NEW_PRODUCT_SUCCESS,
    NEW_PRODUCT_FAIL,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_SUCCESS,
    DELETE_PRODUCT_FAIL,
    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_SUCCESS,
    UPDATE_PRODUCT_FAIL,
    NEW_REVIEW_REQUEST,
    NEW_REVIEW_SUCCESS,
    NEW_REVIEW_FAIL,
    GET_REVIEWS_REQUEST,
    GET_REVIEWS_SUCCESS,
    GET_REVIEWS_FAIL,
    DELETE_REVIEW_REQUEST,
    DELETE_REVIEW_SUCCESS,
    DELETE_REVIEW_FAIL,

    CLEAR_ERRORS
} from '../constants/productConstants';

export const getProducts = (currentPage = 1, keyword = '', price, category = '', minimumRating = 0) => async (dispatch) => {
    try {
        dispatch({
            type: ALL_PRODUCTS_REQUEST
        })

        const params = new URLSearchParams({
            page: currentPage,
            keyword,
            'price[lte]': price[1],
            'price[gte]': price[0],
        })
        if (category) params.set('category', category)
        if (minimumRating > 0) params.set('rating', minimumRating)
        const link = `${import.meta.env.VITE_API}/products?${params.toString()}`
        const { data } = await axios.get(link)
        console.log(data)
        dispatch({
            type: ALL_PRODUCTS_SUCCESS,
            payload: data
        })

    } catch (error) {
        dispatch({
            type: ALL_PRODUCTS_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

export const getProductDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST })
        const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
        dispatch({
            type: PRODUCT_DETAILS_SUCCESS,
            payload: data.product
        })
    } catch (error) {
        dispatch({
            type: PRODUCT_DETAILS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const newProduct = (productData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_PRODUCT_REQUEST })
        const config = {
            withCredentials: true //correct
        }
        const { data } = await axios.post(`${import.meta.env.VITE_API}/admin/product/new`, productData, config)
        dispatch({
            type: NEW_PRODUCT_SUCCESS,
            payload: data
        })
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Unable to create product'
        dispatch({
            type: NEW_PRODUCT_FAIL,
            payload: message
        })
    }
}

export const getAdminProducts = () => async (dispatch) => {
    try {
        dispatch({ type: ADMIN_PRODUCTS_REQUEST })
        const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/products`, {
            //AxiosRequestConfig parameter
            withCredentials: true //correct
        })
        dispatch({
            type: ADMIN_PRODUCTS_SUCCESS,
            payload: data.products
        })
    } catch (error) {
        dispatch({
            type: ADMIN_PRODUCTS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const updateProduct = (id, productData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PRODUCT_REQUEST })
        const config = {
            withCredentials: true
        }
        const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/product/${id}`, productData, config)
        dispatch({
            type: UPDATE_PRODUCT_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Unable to update product'
        dispatch({
            type: UPDATE_PRODUCT_FAIL,
            payload: message
        })
    }
}

export const deleteProduct = (id) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_PRODUCT_REQUEST })
        const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/product/${id}`, { withCredentials: true })
        dispatch({
            type: DELETE_PRODUCT_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: DELETE_PRODUCT_FAIL,
            payload: error.response.data.message
        })
    }
}

export const newReview = (reviewData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_REVIEW_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await axios.put(`${import.meta.env.VITE_API}/review`, reviewData, config)
        dispatch({
            type: NEW_REVIEW_SUCCESS,
            payload: data.success
        })
        return data
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Could not save your review.'
        dispatch({
            type: NEW_REVIEW_FAIL,
            payload: message
        })
        return { success: false, message }
    }
}

export const getReviewEligibility = async (id) => {
    try {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/product/${id}/review-eligibility`,
            { withCredentials: true }
        )
        return data
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Could not check review eligibility.',
        }
    }
}

export const getProductReviews = (id) => async (dispatch) => {
    try {
        dispatch({ type: GET_REVIEWS_REQUEST })
        const { data } = await axios.get(`${import.meta.env.VITE_API}/reviews?id=${id}`, { withCredentials: true })
        dispatch({
            type: GET_REVIEWS_SUCCESS,
            payload: data.reviews
        })
    } catch (error) {
        dispatch({
            type: GET_REVIEWS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const deleteReview = (id, productId) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_REVIEW_REQUEST })
        const { data } = await axios.delete(`${import.meta.env.VITE_API}/reviews?id=${id}&productId=${productId}`, { withCredentials: true })
        dispatch({
            type: DELETE_REVIEW_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: DELETE_REVIEW_FAIL,
            payload: error.response.data.message
        })
    }
}

export const clearErrors = () => async (dispatch) => {
    dispatch({
        type: CLEAR_ERRORS

    })
}
