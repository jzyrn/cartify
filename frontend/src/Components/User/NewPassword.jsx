import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Alert from '@mui/material/Alert'
import axios from 'axios'
import MetaData from '../Layout/MetaData'
import { ActionLoader } from '../Layout/Loader'
import { API_BASE_URL } from '../Utils/Helpers'
import loginImage from '../../assets/cartify_panel.png'

const GREEN = '#1a3329'
const GOLD = '#c9a227'
const fieldSx = {
  mb: 2,
  '& label.Mui-focused': { color: GREEN },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: GREEN },
}

export default function NewPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useParams()

  const submitHandler = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await axios.put(`${API_BASE_URL}/password/reset/${token}`, { password, confirmPassword })
      setSuccess('Your password was reset successfully. You can now sign in with your new password.')
      setPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Password reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const visibilityAdornment = (shown, toggle) => (
    <InputAdornment position="end">
      <IconButton size="small" edge="end" onClick={toggle} aria-label={shown ? 'Hide password' : 'Show password'} title={shown ? 'Hide password' : 'Show password'} sx={{ color: GREEN }}>{shown ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton>
    </InputAdornment>
  )

  return (
    <>
      <MetaData title="New Password" />
      <section className="auth-page">
        <div className="auth-shell">
          <div className="auth-visual"><img src={loginImage} alt="Cartify" /></div>
          <div className="auth-form-side">
            <h1 className="auth-title">Choose a new password</h1>
            <p className="auth-subtitle">Create a new password for your Cartify account.</p>
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={submitHandler}>
              <TextField
                id="password_field"
                label="New password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                inputProps={{ minLength: 6 }}
                required
                fullWidth
                sx={fieldSx}
                InputProps={{ endAdornment: visibilityAdornment(showPassword, () => setShowPassword((shown) => !shown)) }}
              />
              <TextField
                id="confirm_password_field"
                label="Confirm new password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                inputProps={{ minLength: 6 }}
                required
                fullWidth
                sx={fieldSx}
                InputProps={{ endAdornment: visibilityAdornment(showConfirm, () => setShowConfirm((shown) => !shown)) }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ bgcolor: GREEN, color: GOLD, fontWeight: 700, letterSpacing: 1, py: 1.5, '&:hover': { bgcolor: '#12241c' } }}>
                {loading ? <><ActionLoader size={18} color={GOLD} />Saving…</> : 'UPDATE PASSWORD'}
              </Button>
            </form>
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success} <Link to="/login">Sign in</Link></Alert>}
            <p className="auth-subtitle" style={{ marginTop: 20 }}><Link to="/login">Back to sign in</Link></p>
          </div>
        </div>
      </section>
    </>
  )
}
