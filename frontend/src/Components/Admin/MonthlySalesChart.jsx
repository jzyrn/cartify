import React, { useMemo } from 'react'
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
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

export default function MonthlySalesChart({ orders = [], startDate, endDate }) {
    const sales = useMemo(() => {
        const byMonth = new Map()

        orders.forEach((order) => {
            if (order.orderStatus !== 'Delivered') return
            const key = dateKey(order.createdAt)
            if (!key || (startDate && key < startDate) || (endDate && key > endDate)) return

            const monthKey = key.slice(0, 7)
            byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + Number(order.totalPrice || 0))
        })

        return [...byMonth.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, total]) => {
                const [year, month] = monthKey.split('-').map(Number)
                return {
                    month: new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
                    total,
                }
            })
    }, [orders, startDate, endDate])

    if (sales.length === 0) {
        return (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary" variant="body2">No delivered sales in this date range.</Typography>
            </Box>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sales} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GREEN_MID} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={GREEN_MID} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8eeea" strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7a73' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7a73' }} tickFormatter={short} width={55} />
                <Tooltip
                    formatter={(value) => [`₱${Number(value).toLocaleString('en-PH')}`, 'Sales']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e3e9e5', boxShadow: 'none' }}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke={GREEN_MID}
                    strokeWidth={2.5}
                    fill="url(#salesFill)"
                    dot={false}
                    activeDot={{ r: 5, fill: GOLD, stroke: '#fff', strokeWidth: 2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
