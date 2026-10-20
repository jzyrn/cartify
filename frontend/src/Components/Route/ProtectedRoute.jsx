import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Loader from '../Layout/Loader'

const ProtectedRoute = ({ children, isAdmin = false }) => {
    const { isAuthenticated, loading, user } = useSelector(state => state.auth)

    if (loading) {
        return <Loader />
    }

    // not logged in: the login page reads ?reason=unauthorized and shows the message
    if (!isAuthenticated) {
        return <Navigate to="/login?reason=unauthorized" replace />
    }

    // logged in but not an admin
    if (isAdmin === true && user?.role !== 'admin') {
        return <Navigate to="/?reason=unauthorized" replace />
    }

    return children
}

export default ProtectedRoute