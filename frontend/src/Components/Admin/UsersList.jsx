import React, { useEffect, useState } from 'react'
import { Box, MenuItem, Paper, Select } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { AdminLayout, PageHeader, PageLoader, IconAction, StatusPill, cardSx, dataGridSx, gridProps, idCellSx } from './AdminUI'
import { allUsers, deleteUser, updateUserStatus, clearErrors } from '../../actions/userActions'
import { DELETE_USER_RESET } from '../../constants/userConstants'

const UsersList = () => {
    const dispatch = useDispatch()
    const { loading, error, users } = useSelector(state => state.allUsers)
    const { isDeleted, loading: deleting } = useSelector(state => state.user)
    const currentUser = useSelector(state => state.auth.user)
    const [updatingStatusId, setUpdatingStatusId] = useState(null)

    const errMsg = (message = '') => toast.error(message, { position: 'bottom-right' })
    const successMsg = (message = '') => toast.success(message, { position: 'bottom-right' })

    useEffect(() => {
        dispatch(allUsers())

        if (error) {
            errMsg(error)
            dispatch(clearErrors())
        }

        if (isDeleted) {
            successMsg('User deleted successfully')
            dispatch({ type: DELETE_USER_RESET })
        }
    }, [dispatch, error, isDeleted])

    const deleteUserHandler = (id) => {
        dispatch(deleteUser(id))
    }

    const statusHandler = async (id, isActive) => {
        if (updatingStatusId || String(id) === String(currentUser?._id)) return
        setUpdatingStatusId(id)
        try {
            const updatedUser = await updateUserStatus(id, isActive)
            toast.success(`${updatedUser.name}'s account ${isActive ? 'activated' : 'deactivated'}.`, { position: 'bottom-right' })
            dispatch(allUsers())
        } catch (statusError) {
            const message = statusError.response?.data?.message
                || (statusError.response?.status === 404
                    ? 'User update route was not found. Check that the frontend is connected to the Cartify backend.'
                    : statusError.code === 'ERR_NETWORK'
                    ? 'Cannot reach the server. Check that the backend is running and restart it to load the account-status route.'
                    : statusError.message)
                || 'Could not update account status.'
            toast.error(message, { position: 'bottom-right' })
        } finally {
            setUpdatingStatusId(null)
        }
    }

    const columns = [
        {
            field: 'id',
            headerName: 'User ID',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => <Box component="span" sx={idCellSx}>{params.value}</Box>,
        },
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
        {
            field: 'role',
            headerName: 'Role',
            width: 110,
            renderCell: (params) => <StatusPill label={params.value} tone={params.value === 'admin' ? 'gold' : 'neutral'} />,
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Select
                    size="small"
                    value={params.value ? 'active' : 'deactivated'}
                    renderValue={() => params.value ? 'Active' : 'Deactivated'}
                    onChange={(event) => statusHandler(params.id, event.target.value === 'activate')}
                    disabled={updatingStatusId !== null || String(params.id) === String(currentUser?._id)}
                    inputProps={{ 'aria-label': `Account status for ${params.row.name}` }}
                    sx={{ minWidth: 132, fontSize: 13, bgcolor: params.value ? '#e8f4ed' : '#fce8e6', '& .MuiOutlinedInput-notchedOutline': { border: 0 } }}
                >
                    {params.value
                        ? <MenuItem value="deactivate">Deactivate</MenuItem>
                        : <MenuItem value="activate">Activate</MenuItem>}
                </Select>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 110,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconAction to={`/admin/user/${params.id}`} icon="fa-pencil" title="Edit" />
                    <IconAction onClick={() => deleteUserHandler(params.id)} icon="fa-trash" title="Delete" tone="danger" loading={deleting} />
                </Box>
            ),
        },
    ]

    const rows = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== false,
    }))

    return (
        <>
            <MetaData title={'All Users'} />
            <AdminLayout>
                <PageHeader title="All Users" subtitle={`${users.length} registered user${users.length === 1 ? '' : 's'}`} />
                <Paper variant="outlined" sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <PageLoader />
                    ) : (
                        <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} sx={dataGridSx} {...gridProps} />
                    )}
                </Paper>
            </AdminLayout>
        </>
    )
}

export default UsersList
