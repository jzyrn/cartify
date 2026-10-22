import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import axios from 'axios'
import * as FacebookLoginPkg from '@greatsumini/react-facebook-login'   // Facebook login package (maintained fork of react-facebook-login)
import { signInWithPopup, signOut } from 'firebase/auth'        // Google login with Firebase Authentication
import { auth, googleProvider, firebaseConfigured } from '../../firebase'
import { login, clearErrors, loadUser } from '../../actions/userActions'
import { loginSchema } from '../../validation/schemas'

// change the file name if your image is named differently
import loginImage from '../../assets/cartify_panel.png'

// the package is CommonJS, so Vite can hand back a wrapper object instead of the component
const FacebookLogin =
    FacebookLoginPkg.default?.default ||
    FacebookLoginPkg.default ||
    FacebookLoginPkg.FacebookLogin

const GREEN = '#1a3329'
const GOLD = '#c9a227'

// keeps the MUI inputs in the site's green instead of the default blue
const fieldSx = {
    mb: 2,
    '& label.Mui-focused': { color: GREEN },
    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: GREEN },
}

const socialBtnSx = {
    color: '#3a3a36',
    borderColor: '#d9d7d2',
    fontWeight: 600,
    letterSpacing: 1,
    py: 1.4,
    gap: 1,
    '&:hover': { borderColor: GREEN, bgcolor: '#fafaf8' },
}

const GoogleG = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
)

const FacebookF = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
)

const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID

const Login = () => {
    const { isAuthenticated, error, loading, user } = useSelector(state => state.auth)
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState('')
    const [notice, setNotice] = useState('')
    const [socialLoading, setSocialLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    const submitHandler = ({ email, password }) => {
        setLoginError('')
        setNotice('')
        dispatch(login(email, password))
    }

    // sends the token to our backend, which sets the same login cookie as the normal login
    const socialLogin = async (path, body) => {
        setSocialLoading(true)
        try {
            await axios.post(`${import.meta.env.VITE_API}${path}`, body, { withCredentials: true })
            dispatch(loadUser()) // the effect below redirects once the user is loaded
        } catch (err) {
            console.error('Social login request failed:', err)
            setLoginError(
                err.response?.data?.message ||
                (err.response ? `The server returned an error (${err.response.status}).` : 'Cannot reach the server. Is the backend running?')
            )
        } finally {
            setSocialLoading(false)
        }
    }

    // Google sign-in through Firebase Authentication
    const googleHandler = async () => {
        setLoginError('')
        setNotice('')
        if (!firebaseConfigured) {
            setNotice('Google sign-in is not set up yet (the VITE_FIREBASE_* values are missing).')
            return
        }
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const idToken = await result.user.getIdToken()
            await socialLogin('/auth/firebase', { idToken })
            await signOut(auth) // our own cookie keeps the session, Firebase's copy isn't needed
        } catch (err) {
            console.error('Google sign-in error:', err)
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return

            const messages = {
                'auth/unauthorized-domain': 'This site is not an authorized domain in Firebase. Add "localhost" under Authentication > Settings > Authorized domains.',
                'auth/operation-not-allowed': 'Google sign-in is not turned on in Firebase. Enable it under Authentication > Sign-in method.',
                'auth/popup-blocked': 'Your browser blocked the popup. Allow popups for this site and try again.',
                'auth/invalid-api-key': 'The Firebase API key is wrong. Check VITE_FIREBASE_API_KEY in frontend/.env, then restart npm run dev.',
                'auth/network-request-failed': 'Network error. Check your internet connection.',
            }
            setLoginError(messages[err.code] || `Google sign-in failed (${err.code || err.message}).`)
        }
    }

    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') : ''

    useEffect(() => {
        if (isAuthenticated && redirect === 'shipping') {
            navigate('/shipping')
        } else if (isAuthenticated) {
            navigate(user?.role === 'admin' ? '/dashboard' : '/')
        }
        if (error) {
            // shown as a MUI Alert inside the form
            setLoginError(error)
            dispatch(clearErrors())
        }
    }, [error, isAuthenticated, dispatch, navigate, redirect, user?.role])

    // shows a message when a protected page sent the visitor here
    // (kept after the effect above so its message is the one that stays on screen)
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        if (params.get('reason') === 'unauthorized') {
            setLoginError('Unauthorized access. Please sign in to continue.')
            // remove the param so a refresh doesn't show the message again
            navigate('/login', { replace: true })
        }
    }, [location.search, navigate])

    const facebookButton = (onClick) => (
        <Button
            variant="outlined"
            fullWidth
            onClick={onClick}
            disabled={socialLoading}
            startIcon={<FacebookF />}
            sx={socialBtnSx}
        >
            CONTINUE WITH FACEBOOK
        </Button>
    )

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={'Login'} />

                    <section className="auth-page">
                        <div className="auth-shell">
                            {/* left: the full image, no text on top */}
                            <div className="auth-visual">
                                <img src={loginImage} alt="Cartify" />
                            </div>

                            {/* right: form */}
                            <div className="auth-form-side">
                                <h1 className="auth-title">Your account</h1>
                                <p className="auth-subtitle">Sign in to see your cart and profile.</p>

                                <div className="auth-tabs">
                                    <span className="auth-tab active">Sign in</span>
                                    <Link to="/register" className="auth-tab">Create account</Link>
                                </div>

                                {/* MUI Alerts replace the error toast */}
                                {loginError && (
                                    <Alert severity="error" onClose={() => setLoginError('')} sx={{ mb: 2 }}>
                                        {loginError}
                                    </Alert>
                                )}
                                {notice && (
                                    <Alert severity="info" onClose={() => setNotice('')} sx={{ mb: 2 }}>
                                        {notice}
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit(submitHandler)} noValidate>
                                    <TextField
                                        id="email_field"
                                        label="Email"
                                        type="email"
                                        placeholder="you@email.com"
                                        {...register('email')}
                                        error={Boolean(errors.email)}
                                        helperText={errors.email?.message}
                                        fullWidth
                                        sx={fieldSx}
                                    />

                                    <TextField
                                        id="password_field"
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Your password"
                                        {...register('password')}
                                        error={Boolean(errors.password)}
                                        helperText={errors.password?.message}
                                        fullWidth
                                        sx={fieldSx}
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Button
                                                            size="small"
                                                            onClick={() => setShowPassword((show) => !show)}
                                                            sx={{ color: GREEN, minWidth: 0 }}
                                                        >
                                                            {showPassword ? 'Hide' : 'Show'}
                                                        </Button>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />

                                    <div className="auth-forgot">
                                        <Link to="/password/forgot">Forgot password?</Link>
                                    </div>

                                    <Button
                                        id="login_button"
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        sx={{
                                            bgcolor: GREEN,
                                            color: GOLD,
                                            fontWeight: 700,
                                            letterSpacing: 1,
                                            py: 1.5,
                                            '&:hover': { bgcolor: '#12241c' },
                                        }}
                                    >
                                        SIGN IN
                                    </Button>
                                </form>

                                {/* OR + Google / Facebook */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                                    <span style={{ flex: 1, height: 1, background: '#e6e4df' }} />
                                    <span style={{ fontSize: 11, letterSpacing: 1.5, color: '#9a9890' }}>OR</span>
                                    <span style={{ flex: 1, height: 1, background: '#e6e4df' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* Google: Firebase Authentication */}
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={googleHandler}
                                        disabled={socialLoading}
                                        startIcon={<GoogleG />}
                                        sx={socialBtnSx}
                                    >
                                        CONTINUE WITH GOOGLE
                                    </Button>

                                    {/* Facebook: react-facebook-login package */}
                                    {facebookAppId && FacebookLogin ? (
                                        <FacebookLogin
                                            appId={facebookAppId}
                                            scope="public_profile,email"
                                            onSuccess={(response) => socialLogin('/auth/facebook', { accessToken: response.accessToken })}
                                            onFail={(err) => {
                                                console.error('Facebook login failed:', err)
                                                setLoginError(`Facebook sign-in failed (${err?.status || 'unknown'}).`)
                                            }}
                                            render={({ onClick }) => facebookButton(onClick)}
                                        />
                                    ) : (
                                        facebookButton(() => setNotice('Facebook sign-in is not set up yet (VITE_FACEBOOK_APP_ID is missing).'))
                                    )}
                                </div>

                                <p style={{ fontSize: 12, color: '#8d8b84', marginTop: 20 }}>
                                    By continuing you agree to our{' '}
                                    <span style={{ textDecoration: 'underline' }}>terms</span> and{' '}
                                    <span style={{ textDecoration: 'underline' }}>privacy notice</span>.
                                </p>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </>
    )
}

export default Login
