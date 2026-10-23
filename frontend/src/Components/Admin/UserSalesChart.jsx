import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Box, Typography } from '@mui/material'

const GREEN_MID = '#2f6b55'
const GOLD = '#c9a227'
const short = (value) => (value >= 1000 ? `₱${value / 1000}k` : `₱${value}`)

const dateKey = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

const UserSalesChart = ({ orders = [], startDate, endDate }) => {
    const sales = useMemo(() => {
        const byCustomer = new Map()

        orders.forEach((order) => {
            if (order.orderStatus !== 'Delivered') return
            const key = dateKey(order.createdAt)
            if (!key || (startDate && key < startDate) || (endDate && key > endDate)) return

            const customerName = order.user?.name || 'Customer unavailable'
            byCustomer.set(customerName, (byCustomer.get(customerName) || 0) + Number(order.totalPrice || 0))
        })

        return [...byCustomer.entries()]
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
    }, [orders, startDate, endDate])

    if (sales.length === 0) {
        return (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary" variant="body2">No customer sales in this date range.</Typography>
            </Box>
        )
    }

    const maxIndex = 0

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sales} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e8eeea" strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7a73' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7a73' }} tickFormatter={short} width={55} />
                <Tooltip
                    cursor={{ fill: 'rgba(23,51,42,0.05)' }}
                    formatter={(value) => [`₱${Number(value).toLocaleString('en-PH')}`, 'Total']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e3e9e5', boxShadow: 'none' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {sales.map((item, index) => (
                        <Cell key={item.name} fill={index === maxIndex ? GOLD : GREEN_MID} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

export default UserSalesChart
