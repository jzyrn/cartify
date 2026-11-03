import { toast } from 'react-toastify'

// Backend address. Put VITE_API=http://localhost:4001/api/v1 in your frontend .env, or leave this default.
export const API_BASE_URL = import.meta.env.VITE_API || 'http://localhost:4001/api/v1'

// save token + user after login / register
export const authenticate = (data, next) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    if (next) next()
}

export const getToken = () => localStorage.getItem('token') || ''

export const getUser = () => {
    try {
        const user = localStorage.getItem('user')
        return user && getToken() ? JSON.parse(user) : null
    } catch (err) {
        return null
    }
}

// keep the saved user in sync after a profile update
export const saveUser = (user) => localStorage.setItem('user', JSON.stringify(user))

export const logout = (next) => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (next) next()
}

// Authenticated API routes use the httpOnly session cookie. Include it on
// cross-origin requests (Render frontend -> Render backend).
export const authConfig = () => ({ withCredentials: true })

// toast helpers
export const errMsg = (message = '') => toast.error(message, { position: 'bottom-right' })

export const successMsg = (message = '') => toast.success(message, { position: 'bottom-right' })
