const express = require('express');
const app = express();
const cors = require('cors')
const products = require('./routes/product');
const authRoutes = require('./routes/auth');
const order = require('./routes/order');
const cookieParser = require('cookie-parser')
const { rateLimit } = require('express-rate-limit')

const normalizeOrigin = value => {
    if (!value) return null
    try {
        return new URL(value).origin
    } catch {
        return value.replace(/\/$/, '')
    }
}

const allowedOrigins = new Set([
    normalizeOrigin(process.env.FRONTEND_URL),
    'http://localhost:5173',
    'http://localhost:5174',
].filter(Boolean))

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(normalizeOrigin(origin))) return callback(null, true)
        return callback(new Error('This origin is not allowed by CORS'))
    },
    credentials: true,
}))
// Render runs behind a proxy; trust it so IP-based rate limiting uses the client IP.
app.set('trust proxy', 1)
app.use('/api/v1', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
}))
// bigger limits so base64 product images don't cause 413 Payload Too Large
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use('/api/v1', products);
app.use('/api/v1', authRoutes);
app.use('/api/v1', order);


module.exports = app
