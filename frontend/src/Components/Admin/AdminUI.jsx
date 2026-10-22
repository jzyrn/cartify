import React from 'react'
import { Link } from 'react-router-dom'
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'

export const GREEN = '#17332a'
export const GREEN_DARK = '#0f241d'
export const GOLD = '#c9a227'

export const cardSx = { borderRadius: 2, borderColor: '#e3e9e5', p: 3, bgcolor: '#fff' }

/* docked sidebar + content area used by every admin page */
export const AdminLayout = ({ children }) => (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', bgcolor: '#f4f7f5' }}>
        <Sidebar />
        <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {children}
        </Box>
    </Box>
)

export const PageHeader = ({ title, subtitle, action }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: GREEN }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography color="text.secondary" variant="body2">
                    {subtitle}
                </Typography>
            )}
        </Box>
        {action}
    </Box>
)

export const PageLoader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <Loader size={28} fullScreen={false} />
    </Box>
)

/* gold-underlined green button, same look as the cart / login buttons */
export const primaryBtnSx = {
    textTransform: 'none',
    fontWeight: 700,
    borderRadius: 2,
    px: 3,
    py: 1.2,
    bgcolor: GREEN,
    color: '#fff',
    borderBottom: `3px solid ${GOLD}`,
    '&:hover': { bgcolor: GREEN_DARK, color: GOLD },
    '&.Mui-disabled': { bgcolor: '#9aa8a1', color: '#fff', borderBottomColor: '#cfd6d2' },
}

export const fieldSx = {
    '& label.Mui-focused': { color: GREEN },
    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: GOLD },
}

export const IconAction = ({ to, onClick, icon, title, tone = 'green' }) => {
    const tones = {
        green: { bg: '#eef3f0', color: GREEN, hbg: GREEN, hcolor: GOLD },
        danger: { bg: '#fdecea', color: '#b3261e', hbg: '#b3261e', hcolor: '#fff' },
    }
    const t = tones[tone]
    const linkProps = to ? { component: Link, to } : { onClick }
    return (
        <Tooltip title={title}>
            <IconButton
                size="small"
                {...linkProps}
                sx={{
                    width: 32, height: 32, borderRadius: 2, bgcolor: t.bg, color: t.color,
                    '&:hover': { bgcolor: t.hbg, color: t.hcolor },
                }}
            >
                <i className={`fa ${icon}`} style={{ fontSize: 14 }} />
            </IconButton>
        </Tooltip>
    )
}

export const StatusPill = ({ label, tone = 'neutral' }) => {
    const tones = {
        neutral: { bg: '#eef3f0', color: GREEN },
        good: { bg: '#e6f4ea', color: '#1e7a3c' },
        gold: { bg: '#f7eecb', color: '#8c7418' },
        danger: { bg: '#fdecea', color: '#b3261e' },
    }
    const t = tones[tone]
    return (
        <Box
            component="span"
            sx={{ px: 1.2, py: 0.3, borderRadius: 10, fontSize: 12, fontWeight: 600, bgcolor: t.bg, color: t.color, whiteSpace: 'nowrap' }}
        >
            {label}
        </Box>
    )
}

export const InfoRow = ({ label, children }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.1, borderBottom: '1px solid #eef3f0', '&:last-of-type': { borderBottom: 0 } }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={600} sx={{ color: GREEN, textAlign: 'right', wordBreak: 'break-word' }}>
            {children}
        </Typography>
    </Box>
)

export const dataGridSx = {
    border: 0,
    '--DataGrid-t-header-background-base': '#eef3f0',
    '& .MuiDataGrid-columnHeader': { bgcolor: '#eef3f0' },
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: GREEN },
    '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', color: '#33433b' },
    '& .MuiDataGrid-row:hover': { bgcolor: '#f7faf8' },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
    '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e3e9e5' },
}

export const gridProps = {
    autoHeight: true,
    disableRowSelectionOnClick: true,
    showToolbar: true,
    pageSizeOptions: [5, 10, 25],
    initialState: { pagination: { paginationModel: { pageSize: 10 } } },
}

export const idCellSx = { fontFamily: 'monospace', fontSize: 12, color: '#6b7a73', wordBreak: 'break-all' }