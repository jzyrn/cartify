import axios from 'axios'
import { ADD_TO_CART, REMOVE_ITEM_CART, REMOVE_ITEMS_CART, SAVE_SHIPPING_INFO, CLEAR_CART, RESTORE_USER_CART } from '../constants/cartConstants'

const getUserId = user => user?._id || user?.id
const cartStorageKey = userId => `cartItems:${userId}`
const shippingStorageKey = userId => `shippingInfo:${userId}`

const persistActiveCart = getState => {
    const { auth, cart } = getState()
    const userId = auth?.isAuthenticated ? getUserId(auth.user) : null
    if (userId) localStorage.setItem(cartStorageKey(userId), JSON.stringify(cart.cartItems))
    localStorage.removeItem('cartItems')
}

export const restoreUserCart = user => dispatch => {
    const userId = getUserId(user)
    if (!userId) return

    const cartKey = cartStorageKey(userId)
    let savedCart = localStorage.getItem(cartKey)
    // Migrate the previous shared cart only after the server confirms the signed-in user.
    if (savedCart === null) {
        const legacyCart = localStorage.getItem('cartItems')
        if (legacyCart !== null) {
            savedCart = legacyCart
            localStorage.setItem(cartKey, legacyCart)
        }
    }
    localStorage.removeItem('cartItems')

    let cartItems = []
    let shippingInfo = {}
    try {
        const parsedCart = JSON.parse(savedCart || '[]')
        if (Array.isArray(parsedCart)) cartItems = parsedCart
        else localStorage.removeItem(cartKey)
    } catch { localStorage.removeItem(cartKey) }
    try {
        const parsedShippingInfo = JSON.parse(localStorage.getItem(shippingStorageKey(userId)) || '{}')
        if (parsedShippingInfo && typeof parsedShippingInfo === 'object' && !Array.isArray(parsedShippingInfo)) shippingInfo = parsedShippingInfo
        else localStorage.removeItem(shippingStorageKey(userId))
    } catch { localStorage.removeItem(shippingStorageKey(userId)) }
    dispatch({ type: RESTORE_USER_CART, payload: { cartItems, shippingInfo } })
}

export const saveUserCartAndClearActive = () => (dispatch, getState) => {
    const { auth, cart } = getState()
    const userId = auth?.isAuthenticated ? getUserId(auth.user) : null
    if (userId) localStorage.setItem(cartStorageKey(userId), JSON.stringify(cart.cartItems))
    localStorage.removeItem('cartItems')
    localStorage.removeItem('shippingInfo')
    dispatch({ type: CLEAR_CART })
}

// Same structure as the professor's file. Differences kept for Cart.jsx:
//  - shade (default '') so one product can sit in the cart in several shades
//  - brand is saved on the cart line
//  - only logged-in users can add to the cart (returns false otherwise)
//  - images?.[0]?.url so a product with no image doesn't crash
export const addItemToCart = (id, quantity, shade = '', clampToAvailableStock = false) => async (dispatch, getState) => {
    if (!getState().auth?.isAuthenticated) {
        return false
    }

    const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
    const product = data.product
    const requestedQuantity = Number(quantity)
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
        throw new Error('Choose a quantity of at least 1.')
    }
    const availableStock = Number(product.stock || 0)
    if (requestedQuantity > availableStock && !clampToAvailableStock) {
        throw new Error(`Only ${Number(product.stock || 0)} unit(s) are currently available.`)
    }
    const safeQuantity = clampToAvailableStock ? Math.min(requestedQuantity, availableStock) : requestedQuantity
    if (safeQuantity < 1) throw new Error('This product is currently out of stock.')
    dispatch({
        type: ADD_TO_CART,
        payload: {
            product: product._id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.images?.[0]?.url || '',
            stock: product.stock,
            shade,
            quantity: safeQuantity
        }
    })
    persistActiveCart(getState)
    return true
}

// the professor's version takes only the id; the shade is needed to tell cart lines apart
export const removeItemFromCart = (id, shade = '') => async (dispatch, getState) => {
    dispatch({
        type: REMOVE_ITEM_CART,
        payload: { product: id, shade }
    })
    persistActiveCart(getState)
}

export const removeItemsFromCart = (items) => async (dispatch, getState) => {
    dispatch({
        type: REMOVE_ITEMS_CART,
        payload: items.map(({ product, shade }) => ({ product, shade: shade || '' })),
    })
    persistActiveCart(getState)
}

export const saveShippingInfo = (data) => async (dispatch, getState) => {
    dispatch({
        type: SAVE_SHIPPING_INFO,
        payload: data
    })
    const userId = getUserId(getState().auth?.user)
    if (userId) localStorage.setItem(shippingStorageKey(userId), JSON.stringify(data))
}

// used by Payment.jsx after the order is placed.
// The professor's version only changes Redux, so the old cart came back after a refresh;
// this one also clears what was saved in localStorage.
export const clearCart = () => async (dispatch, getState) => {
    const userId = getUserId(getState().auth?.user)
    if (userId) {
        localStorage.removeItem(cartStorageKey(userId))
        localStorage.removeItem(shippingStorageKey(userId))
    }
    dispatch({
        type: CLEAR_CART,
    })
    localStorage.removeItem('cartItems')
    localStorage.removeItem('shippingInfo')
}
