import axios from 'axios'
import {
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAIL,
    MY_ORDERS_REQUEST,
    MY_ORDERS_SUCCESS,
    MY_ORDERS_FAIL,
    ORDER_DETAILS_REQUEST,

    ORDER_DETAILS_SUCCESS,

    ORDER_DETAILS_FAIL,
    ALL_ORDERS_REQUEST,

    ALL_ORDERS_SUCCESS,

    ALL_ORDERS_FAIL,
    UPDATE_ORDER_SUCCESS,

    UPDATE_ORDER_REQUEST,

    UPDATE_ORDER_FAIL,
    DELETE_ORDER_REQUEST,
    DELETE_ORDER_SUCCESS,
    DELETE_ORDER_FAIL,
    CLEAR_ERRORS

} from '../constants/orderConstants'

// Same as the professor's createOrder, with two changes for Payment.jsx:
//  - it returns the result, so the page knows whether the order was saved
//  - the error message no longer crashes when the server can't be reached (no error.response)
export const createOrder = (order) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await axios.post(`${import.meta.env.VITE_API}/order/new`, order, config)
        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: data
        })
        return data
    } catch (error) {
        const message = error.response?.data?.message || error.message
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: message
        })
        return { success: false, message }
    }

}

export const myOrders = () => async (dispatch) => {
    try {
        dispatch({ type: MY_ORDERS_REQUEST });
        const { data } = await axios.get(`${import.meta.env.VITE_API}/orders/me`, { withCredentials: true })
        dispatch({
            type: MY_ORDERS_SUCCESS,
            payload: data.orders
        })
    } catch (error) {
        dispatch({
            type: MY_ORDERS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const getOrderDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: ORDER_DETAILS_REQUEST });
        const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, { withCredentials: true })
        dispatch({
            type: ORDER_DETAILS_SUCCESS,
            payload: data.order
        })
    } catch (error) {
        dispatch({
            type: ORDER_DETAILS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const allOrders = () => async (dispatch) => {

    try {
        dispatch({ type: ALL_ORDERS_REQUEST });
        const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/orders`, {
            //AxiosRequestConfig parameter
            withCredentials: true //correct
        })

        let orders = data.orders || []
        const needsCustomerLookup = orders.some(order => order.user && !order.user.name)

        // Older API deployments may return the raw user ID instead of a populated user.
        if (needsCustomerLookup) {
            try {
                const { data: usersData } = await axios.get(`${import.meta.env.VITE_API}/admin/users`, {
                    withCredentials: true
                })
                const usersById = new Map((usersData.users || []).map(user => [String(user._id), user]))
                orders = orders.map(order => {
                    if (order.user?.name || !order.user) return order
                    const userId = typeof order.user === 'object' ? order.user._id : order.user
                    return { ...order, user: usersById.get(String(userId)) || order.user }
                })
            } catch {
                // Keep the order list usable if the optional customer lookup fails.
            }
        }

        dispatch({
            type: ALL_ORDERS_SUCCESS,
            payload: { ...data, orders }
        })
    } catch (error) {
        dispatch({
            type: ALL_ORDERS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const updateOrder = (id, orderData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_ORDER_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/order/${id}`, orderData, config)
        dispatch({
            type: UPDATE_ORDER_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: UPDATE_ORDER_FAIL,
            payload: error.response.data.message
        })

    }

}
export const deleteOrder = (id) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_ORDER_REQUEST })
        const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/order/${id}`, { withCredentials: true })
        dispatch({
            type: DELETE_ORDER_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: DELETE_ORDER_FAIL,
            payload: error.response.data.message
        })
    }
}
export const clearErrors = () => async (dispatch) => {
    dispatch({
        type: CLEAR_ERRORS
    })
}
