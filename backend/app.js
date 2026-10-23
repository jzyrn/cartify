const express = require('express');
const app = express();
const cors = require('cors')
const products = require('./routes/product');
const authRoutes = require('./routes/auth');
const order = require('./routes/order');
const cookieParser = require('cookie-parser')


app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}))
// bigger limits so base64 product images don't cause 413 Payload Too Large
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use('/api/v1', products);
app.use('/api/v1', authRoutes);
app.use('/api/v1', order);


module.exports = app
