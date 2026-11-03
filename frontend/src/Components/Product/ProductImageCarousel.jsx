import React, { useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'

const ProductImageCarousel = ({ images = [], alt = 'Product image', compact = false, imageSx = {} }) => {
    const [index, setIndex] = useState(0)
    const sources = images.map(image => typeof image === 'string' ? image : image?.url).filter(Boolean)
    const activeIndex = Math.min(index, Math.max(0, sources.length - 1))

    const move = (direction) => {
        setIndex((current) => (current + direction + sources.length) % sources.length)
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: compact ? 52 : 120, overflow: 'hidden', bgcolor: '#faecd9', display: 'grid', placeItems: 'center' }}>
            {sources.length ? (
                <Box component="img" src={sources[activeIndex]} alt={`${alt}${sources.length > 1 ? `, image ${activeIndex + 1} of ${sources.length}` : ''}`} loading="lazy" decoding="async" sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', ...imageSx }} />
            ) : (
                <Box component="span" sx={{ color: '#1a3329', fontSize: compact ? 18 : 30 }} aria-hidden="true">
                    <i className="fa fa-shopping-bag" />
                </Box>
            )}

            {sources.length > 1 && (
                <>
                    <IconButton
                        size="small"
                        aria-label="Previous product photo"
                        onClick={() => move(-1)}
                        sx={{ position: 'absolute', left: compact ? 1 : 8, top: '50%', transform: 'translateY(-50%)', width: compact ? 22 : 32, height: compact ? 22 : 32, bgcolor: 'rgba(255,255,255,.88)', color: '#1a3329', '&:hover': { bgcolor: '#fff' } }}
                    >
                        <span aria-hidden="true">‹</span>
                    </IconButton>
                    <IconButton
                        size="small"
                        aria-label="Next product photo"
                        onClick={() => move(1)}
                        sx={{ position: 'absolute', right: compact ? 1 : 8, top: '50%', transform: 'translateY(-50%)', width: compact ? 22 : 32, height: compact ? 22 : 32, bgcolor: 'rgba(255,255,255,.88)', color: '#1a3329', '&:hover': { bgcolor: '#fff' } }}
                    >
                        <span aria-hidden="true">›</span>
                    </IconButton>
                    <Typography variant="caption" sx={{ position: 'absolute', bottom: compact ? 1 : 8, left: '50%', transform: 'translateX(-50%)', px: 0.75, borderRadius: 5, bgcolor: 'rgba(20,35,29,.72)', color: '#fff', lineHeight: 1.5 }}>
                        {activeIndex + 1} / {sources.length}
                    </Typography>
                </>
            )}
        </Box>
    )
}

export default ProductImageCarousel
