import React, { useEffect } from 'react'
import { Box, Paper } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { AdminLayout, PageHeader, PageLoader, IconAction, StatusPill, cardSx, dataGridSx, gridProps, idCellSx } from './AdminUI'
import { allUsers, deleteUser, clearErrors } from '../../actions/userActions'
import { DELETE_USER_RESET } from '../../constants/userConstants'

const UsersList = () => {
    const dispatch = useDispatch()
    const { loading, error, users } = useSelector(state => state.allUsers)
    const { isDeleted, loading: deleting } = useSelector(state => state.user)

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
