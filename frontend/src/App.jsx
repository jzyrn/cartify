import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import store from './store'
import { loadUser } from './actions/userActions'

import Header from './Components/Layout/Header'
import Footer from './Components/Layout/Footer'
import ProtectedRoute from './Components/Route/ProtectedRoute'

import Home from './Components/Home'
import ProductDetails from './Components/Product/ProductDetails'
import Cart from './Components/Cart/Cart'

// Checkout
import Shipping from './Components/Cart/Shipping'
import ConfirmOrder from './Components/Cart/ConfirmOrder'
import Payment from './Components/Cart/Payment'
import OrderSuccess from './Components/Cart/OrderSuccess'

import Login from './Components/User/Login'
import Register from './Components/User/Register'
import Profile from './Components/User/Profile'
import UpdateProfile from './Components/User/UpdateProfile'

// Customer orders
import ListOrders from './Components/Order/ListOrders'
import OrderDetails from './Components/Order/OrderDetails'

// Admin
import Dashboard from './Components/Admin/Dashboard'
import ProductsList from './Components/Admin/ProductsList'
import NewProduct from './Components/Admin/NewProduct'
import UpdateProduct from './Components/Admin/UpdateProduct'
import OrdersList from './Components/Admin/OrdersList'
import ProcessOrder from './Components/Admin/ProcessOrder'
import UsersList from './Components/Admin/UsersList'
import UpdateUser from './Components/Admin/UpdateUser'
import ProductReviews from './Components/Admin/ProductReviews'

function App() {
  useEffect(() => {
    store.dispatch(loadUser())
  }, [])

  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />

          {/* Checkout: cart -> shipping -> confirm -> payment -> success */}
          <Route path="/shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
          <Route path="/confirm" element={<ProtectedRoute><ConfirmOrder /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/me/update" element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>} />

          {/* Customer orders */}
          <Route path="/orders/me" element={<ProtectedRoute><ListOrders /></ProtectedRoute>} />
          <Route path="/order/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/dashboard" element={<ProtectedRoute isAdmin={true}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute isAdmin={true}><ProductsList /></ProtectedRoute>} />
          <Route path="/admin/product" element={<ProtectedRoute isAdmin={true}><NewProduct /></ProtectedRoute>} />
          <Route path="/admin/product/:id" element={<ProtectedRoute isAdmin={true}><UpdateProduct /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute isAdmin={true}><OrdersList /></ProtectedRoute>} />
          <Route path="/admin/order/:id" element={<ProtectedRoute isAdmin={true}><ProcessOrder /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute isAdmin={true}><UsersList /></ProtectedRoute>} />
          <Route path="/admin/user/:id" element={<ProtectedRoute isAdmin={true}><UpdateUser /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute isAdmin={true}><ProductReviews /></ProtectedRoute>} />
        </Routes>
        <Footer />
        <ToastContainer />
      </Router>
    </>
  )
}

export default App