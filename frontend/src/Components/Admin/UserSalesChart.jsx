import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Box, Typography } from '@mui/material'
import axios from 'axios'
import Loader from '../Layout/Loader'

const GREEN = '#17332a'
const GREEN_MID = '#2f6b55'
const GOLD = '#c9a227'

const short = (v) => (v >= 1000 ? `₱${v / 1000}k` : `₱${v}`)

const UserSalesChart = ({ startDate, endDate }) => {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const userSales = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/customer-sales`, {
                params: { startDate, endDate },
                withCredentials: true,
            })
            setSales(data.customerSales)
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load customer sales')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        userSales()
    }, [startDate, endDate])

    if (loading || error || sales.length === 0) {
        return (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                    <Loader size={28} fullScreen={false} />
                ) : (
                    <Typography color="text.secondary" variant="body2">{error || 'No customer data yet.'}</Typography>
                )}
            </Box>
        )
    }

    // highlight the top customer in gold
    const maxIndex = sales.reduce((best, item, i, arr) => (item.total > arr[best].total ? i : best), 0)

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sales} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e8eeea" strokeDasharray="3 3" />
                <XAxis dataKey="userDetails.name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7a73' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7a73' }} tickFormatter={short} width={55} />
                <Tooltip
                    cursor={{ fill: 'rgba(23,51,42,0.05)' }}
                    formatter={(v) => [`₱${Number(v).toLocaleString('en-PH')}`, 'Total']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e3e9e5', boxShadow: 'none' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {sales.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={index === maxIndex ? GOLD : GREEN_MID} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

export default UserSalesChart
