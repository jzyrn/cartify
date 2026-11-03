import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Alert from '@mui/material/Alert'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import { ActionLoader } from '../Layout/Loader'
import { API_BASE_URL, authConfig, saveUser } from '../Utils/Helpers'
import loginImage from '../../assets/cartify_panel.png'

const GREEN = '#1a3329'
const GOLD = '#c9a227'
const fieldSx = {
  mb: 2,
  '& label.Mui-focused': { color: GREEN },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: GREEN },
}

export default function UpdatePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submitHandler = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/password/update`,
        { oldPassword, newPassword },
        authConfig()
      )
      if (data.user) saveUser(data.user)
      toast.success('Password updated', { position: 'bottom-right' })
      navigate('/me')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Password update failed. Please try again.')
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
      <MetaData title="Change Password" />
      <section className="auth-page">
        <div className="auth-shell">
          <div className="auth-visual"><img src={loginImage} alt="Cartify" /></div>
          <div className="auth-form-side">
            <h1 className="auth-title">Change your password</h1>
            <p className="auth-subtitle">Choose a strong password to keep your account secure.</p>
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={submitHandler}>
              <TextField
                id="old_password_field"
                label="Current password"
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                required
                fullWidth
                sx={fieldSx}
                InputProps={{ endAdornment: visibilityAdornment(showOld, () => setShowOld((shown) => !shown)) }}
              />
              <TextField
                id="new_password_field"
                label="New password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                inputProps={{ minLength: 6 }}
                required
                fullWidth
                sx={fieldSx}
                InputProps={{ endAdornment: visibilityAdornment(showNew, () => setShowNew((shown) => !shown)) }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ bgcolor: GREEN, color: GOLD, fontWeight: 700, letterSpacing: 1, py: 1.5, '&:hover': { bgcolor: '#12241c' } }}>
                {loading ? <><ActionLoader size={18} color={GOLD} />Updating…</> : 'UPDATE PASSWORD'}
              </Button>
            </form>
            <p className="auth-subtitle" style={{ marginTop: 20 }}><Link to="/me">Back to your account</Link></p>
          </div>
        </div>
      </section>
    </>
  )
}
