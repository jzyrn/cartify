import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Box, Typography } from '@mui/material'
import axios from 'axios'
import Loader from '../Layout/Loader'

const GREEN = '#17332a'

// green + gold palette
const pieColors = [
    '#17332a', '#c9a227', '#2f6b55', '#e0c566', '#4f8f76',
    '#8c7418', '#7fb59d', '#f0dc9a', '#0f241d', '#a98a1c',
]

export default function ProductSalesChart() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const productSales = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/product-sales`, { withCredentials: true })
            setSales(data.totalPercentage)
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load product sales')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        productSales()
    }, [])

    if (loading || error || sales.length === 0) {
        return (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                    <Loader size={28} fullScreen={false} />
                ) : (
                    <Typography color="text.secondary" variant="body2">{error || 'No sales data yet.'}</Typography>
                )}
            </Box>
        )
    }

    return (
        <Box>
            <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                    <Pie
                        data={sales}
                        dataKey="percent"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={2}
                        stroke="none"
                    >
                        {sales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n]}
                        contentStyle={{ borderRadius: 10, border: '1px solid #e3e9e5', boxShadow: 'none' }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* compact legend */}
            <Box sx={{ mt: 1, maxHeight: 100, overflowY: 'auto', pr: 1 }}>
                {sales.map((item, index) => (
                    <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: pieColors[index % pieColors.length], flexShrink: 0 }} />
                        <Typography variant="body2" noWrap sx={{ flex: 1, color: 'text.secondary' }}>
                            {item.name}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: GREEN }}>
                            {Number(item.percent).toFixed(1)}%
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
