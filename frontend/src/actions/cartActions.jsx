import axios from 'axios'
import { ADD_TO_CART, REMOVE_ITEM_CART, SAVE_SHIPPING_INFO, CLEAR_CART } from '../constants/cartConstants'

// Same structure as the professor's file. Differences kept for Cart.jsx:
//  - shade (default '') so one product can sit in the cart in several shades
//  - brand is saved on the cart line
//  - only logged-in users can add to the cart (returns false otherwise)
//  - images?.[0]?.url so a product with no image doesn't crash
export const addItemToCart = (id, quantity, shade = '') => async (dispatch, getState) => {
    if (!getState().auth?.isAuthenticated) {
        return false
    }

    const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
    dispatch({
        type: ADD_TO_CART,
        payload: {
            product: data.product._id,
            name: data.product.name,
            brand: data.product.brand,
            price: data.product.price,
            image: data.product.images?.[0]?.url || '',
            stock: data.product.stock,
            shade,
            quantity
        }
    })
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
    return true
}

// the professor's version takes only the id; the shade is needed to tell cart lines apart
export const removeItemFromCart = (id, shade = '') => async (dispatch, getState) => {
    dispatch({
        type: REMOVE_ITEM_CART,
        payload: { product: id, shade }
    })
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}

export const saveShippingInfo = (data) => async (dispatch) => {
    dispatch({
        type: SAVE_SHIPPING_INFO,
        payload: data
    })
    localStorage.setItem('shippingInfo', JSON.stringify(data))
}

// used by Payment.jsx after the order is placed.
// The professor's version only changes Redux, so the old cart came back after a refresh;
// this one also clears what was saved in localStorage.
export const clearCart = () => async (dispatch) => {
    dispatch({
        type: CLEAR_CART,
    })
    localStorage.removeItem('cartItems')
    localStorage.removeItem('shippingInfo')
}