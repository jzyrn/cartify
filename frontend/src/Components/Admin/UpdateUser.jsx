import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, MenuItem, Paper, TextField } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import MetaData from '../Layout/MetaData'
import { ActionLoader } from '../Layout/Loader'
import { AdminLayout, PageHeader, primaryBtnSx, fieldSx, cardSx } from './AdminUI'
import { updateUser, getUserDetails, clearErrors } from '../../actions/userActions'
import { LOAD_USER_SUCCESS, UPDATE_USER_RESET } from '../../constants/userConstants'
import { adminUserSchema } from '../../validation/schemas'

const UpdateUser = () => {
    const dispatch = useDispatch()
    let navigate = useNavigate()

    const { error, isUpdated, updatedUser, loading: updating } = useSelector(state => state.user)
    const { user } = useSelector(state => state.userDetails)
    const { user: currentUser } = useSelector(state => state.auth)
    const { handleSubmit, reset, control, formState: { errors } } = useForm({
        resolver: yupResolver(adminUserSchema),
        mode: 'onBlur',
        defaultValues: { name: '', email: '', role: '' },
    })

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-right' })
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-right' })

    const { id } = useParams()

    useEffect(() => {
        if (user?._id !== id) {
            dispatch(getUserDetails(id))
        } else if (user?._id === id) {
            reset({ name: user.name, email: user.email, role: user.role })
        }

        if (error) {
            errMsg(error)
            dispatch(clearErrors())
        }

        if (isUpdated) {
            successMsg('User updated successfully')
            // Keep the current session's role in sync when an admin edits their own account.
            if (currentUser?._id === id && updatedUser) {
                dispatch({ type: LOAD_USER_SUCCESS, payload: updatedUser })
                navigate(updatedUser.role === 'admin' ? '/dashboard' : '/me')
            } else {
                navigate('/admin/users')
            }
            dispatch({ type: UPDATE_USER_RESET })
        }
    }, [dispatch, error, navigate, isUpdated, id, user?._id, user?.name, user?.email, user?.role, currentUser?._id, updatedUser, reset])

    const submitHandler = (values) => dispatch(updateUser(id, values))

    return (
        <>
            <MetaData title={`Update User`} />
            <AdminLayout>
                <Box sx={{ width: '100%', maxWidth: 640, alignSelf: 'center' }}>
                    <PageHeader title="Update User" centered />
                </Box>

                <Paper
                    variant="outlined"
                    component="form"
                    noValidate
                    onSubmit={handleSubmit(submitHandler)}
                    sx={{ ...cardSx, alignSelf: 'center', maxWidth: 640, width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                id="name_field"
                                label="Name"
                                error={Boolean(errors.name)}
                                helperText={errors.name?.message}
                                fullWidth
                                sx={fieldSx}
                            />
                        )}
                    />
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                id="email_field"
                                label="Email"
                                type="email"
                                error={Boolean(errors.email)}
                                helperText={errors.email?.message}
                                fullWidth
                                sx={fieldSx}
                            />
                        )}
                    />
                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                id="role_field"
                                label="Role"
                                select
                                error={Boolean(errors.role)}
                                helperText={errors.role?.message}
                                fullWidth
                                sx={fieldSx}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </TextField>
                        )}
                    />

                    <Button type="submit" fullWidth size="large" disableElevation disabled={updating} sx={primaryBtnSx}>
                        {updating ? <><ActionLoader size={20} color="#fff" />Updating…</> : 'Update'}
                    </Button>
                </Paper>
            </AdminLayout>
        </>
    )
}

export default UpdateUser
