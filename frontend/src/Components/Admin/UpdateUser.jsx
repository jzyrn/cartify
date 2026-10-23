import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Paper, TextField } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { ActionLoader } from '../Layout/Loader'
import { AdminLayout, PageHeader, primaryBtnSx, fieldSx, cardSx } from './AdminUI'
import { updateUser, getUserDetails, clearErrors } from '../../actions/userActions'
import { UPDATE_USER_RESET } from '../../constants/userConstants'

const UpdateUser = () => {
    const dispatch = useDispatch()
    let navigate = useNavigate()

    const { error, isUpdated, loading: updating } = useSelector(state => state.user)
    const { user } = useSelector(state => state.userDetails)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-right' })
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-right' })

    const { id } = useParams()

    useEffect(() => {
        if (user && user._id !== id) {
            dispatch(getUserDetails(id))
        } else {
            setName(user.name)
            setEmail(user.email)
            setRole(user.role)
        }

        if (error) {
            errMsg(error)
            dispatch(clearErrors())
        }

        if (isUpdated) {
            successMsg('User updated successfully')
            navigate('/admin/users')
            dispatch({ type: UPDATE_USER_RESET })
        }
    }, [dispatch, error, navigate, isUpdated, id, user])

    const submitHandler = (e) => {
        e.preventDefault()
        const formData = new FormData()
        formData.set('name', name)
        formData.set('email', email)
        formData.set('role', role)
        dispatch(updateUser(user._id, formData))
    }

    return (
        <>
            <MetaData title={`Update User`} />
            <AdminLayout>
                <PageHeader title="Update User" subtitle="Change this user's details and role" />

                <Paper
                    variant="outlined"
                    component="form"
                    onSubmit={submitHandler}
                    sx={{ ...cardSx, maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
                >
                    <TextField id="name_field" name="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={fieldSx} />
                    <TextField id="email_field" name="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth sx={fieldSx} />
                    <TextField
                        id="role_field"
                        name="role"
                        label="Role"
                        select
                        SelectProps={{ native: true }}
                        InputLabelProps={{ shrink: true }}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        fullWidth
                        sx={fieldSx}
                    >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                    </TextField>

                    <Button type="submit" fullWidth size="large" disableElevation disabled={updating} sx={primaryBtnSx}>
                        {updating ? <><ActionLoader size={20} color="#fff" />Updating…</> : 'Update'}
                    </Button>
                </Paper>
            </AdminLayout>
        </>
    )
}

export default UpdateUser
