/* eslint-disable no-case-declarations */
import { ADD_TO_CART, REMOVE_ITEM_CART, SAVE_SHIPPING_INFO, CLEAR_CART } from '../constants/cartConstants'

// The professor's reducer matches cart lines by product only.
// Cart.jsx lets the same product be added in different shades, so a line is product + shade.
const sameLine = (a, b) => a.product === b.product && (a.shade || '') === (b.shade || '')

export const cartReducer = (state = { cartItems: [], shippingInfo: {} }, action) => {
    switch (action.type) {
        case ADD_TO_CART:
            const item = action.payload

            const isItemExist = state.cartItems.find(i => sameLine(i, item))
            if (isItemExist) {
                return {
                    ...state,
                    cartItems: state.cartItems.map(i => sameLine(i, isItemExist) ? item : i)
                }
            } else {
                return {
                    ...state, cartItems: [...state.cartItems, item]
                }
            }
        case REMOVE_ITEM_CART:
            // payload is { product, shade } (the professor's version sends just the id)
            return {
                ...state,
                cartItems: state.cartItems.filter(i => !sameLine(i, action.payload))
            }

        case SAVE_SHIPPING_INFO:
            return {
                ...state,
                shippingInfo: action.payload
            }
        case CLEAR_CART:
            return {
                ...state,
                cartItems: [],
                shippingInfo: {}
            }
        default:
            return state
    }
}