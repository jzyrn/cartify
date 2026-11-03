import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux'
import { thunk } from 'redux-thunk'

import {
    productsReducer,
    productDetailsReducer,
    newProductReducer,
    productReducer,
    newReviewReducer,
    productReviewsReducer,
    reviewReducer,
} from './reducers/productReducers'
import {
    authReducer,
    userReducer,
    forgotPasswordReducer,
    userDetailsReducer,
    allUsersReducer,
} from './reducers/userReducers'
import { cartReducer } from './reducers/cartReducers'
import {
    newOrderReducer,
    myOrdersReducer,
    orderDetailsReducer,
    allOrdersReducer,
    orderReducer,
} from './reducers/orderReducers'

const initialState = {
    cart: {
        // Cart state is restored only after the server identifies the signed-in user.
        cartItems: [],
        shippingInfo: {},
    },
    auth: {},
    user: {},
}

const reducer = combineReducers({
    products: productsReducer,
    productDetails: productDetailsReducer,
    newProduct: newProductReducer,
    product: productReducer,
    newReview: newReviewReducer,
    productReviews: productReviewsReducer,
    review: reviewReducer,
    auth: authReducer,
    user: userReducer,
    forgotPassword: forgotPasswordReducer,
    userDetails: userDetailsReducer,
    allUsers: allUsersReducer,
    cart: cartReducer,
    newOrder: newOrderReducer,
    myOrders: myOrdersReducer,
    orderDetails: orderDetailsReducer,
    allOrders: allOrdersReducer,
    order: orderReducer,
})

const store = createStore(reducer, initialState, applyMiddleware(thunk))
export default store
