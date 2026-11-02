// Seeds sample orders so you can test the order pages and the admin dashboard.
//
//   node orderseeder.js            -> create sample orders
//   node orderseeder.js --delete   -> remove ONLY the sample orders
//
// Real orders are never touched: sample orders are tagged with a paymentInfo.id
// that starts with "SEED-".

const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config({ path: path.join(__dirname, 'config', '.env') })

const Order = require('./models/order')
const Product = require('./models/product')
const User = require('./models/user')

const ORDER_COUNT = 30        // how many sample orders to create
const DAYS_BACK = 150         // spread them over roughly the last 5 months
const TAX_RATE = 0.1          // 10 %
const SHIPPING = 50           // flat shipping fee

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Delivered', 'Delivered']

const ADDRESSES = [
    { address: '12 Rizal St., Brgy. Central', city: 'Taguig', postalCode: '1630', country: 'PH', phoneNo: '09171234567' },
    { address: '45 Mabini Ave., Brgy. Poblacion', city: 'Makati', postalCode: '1210', country: 'PH', phoneNo: '09181234567' },
    { address: '8 Katipunan Rd., Brgy. Loyola', city: 'Quezon City', postalCode: '1108', country: 'PH', phoneNo: '09191234567' },
    { address: '90 Ayala Blvd., Brgy. Ermita', city: 'Manila', postalCode: '1000', country: 'PH', phoneNo: '09201234567' },
    { address: '27 Bonifacio Ave., Brgy. Kapitolyo', city: 'Pasig', postalCode: '1603', country: 'PH', phoneNo: '09211234567' },
]

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[rand(0, arr.length - 1)]

const randomDate = () => {
    const d = new Date()
    d.setDate(d.getDate() - rand(0, DAYS_BACK))
    d.setHours(rand(8, 21), rand(0, 59), 0, 0)
    return d
}

const buildOrder = (users, products, index) => {
    // 1-3 different products per order
    const chosen = [...products].sort(() => Math.random() - 0.5).slice(0, rand(1, Math.min(3, products.length)))

    const orderItems = chosen.map(p => ({
        name: p.name,
        shade: p.shades?.length ? pick(p.shades) : '',
        quantity: rand(1, 3),
        image: (p.images && p.images[0] && p.images[0].url) || 'no-image',
        price: p.price,
        product: p._id,
    }))

    const itemsPrice = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0)
    const taxPrice = Number((itemsPrice * TAX_RATE).toFixed(2))
    const shippingPrice = SHIPPING
    const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2))

    const createdAt = randomDate()
    const orderStatus = pick(STATUSES)

    const order = {
        user: pick(users)._id,
        orderItems,
        shippingInfo: pick(ADDRESSES),
        paymentInfo: { id: `SEED-${Date.now()}-${index}`, status: 'succeeded' },
        paidAt: createdAt,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        orderStatus,
        createdAt,
    }

    if (orderStatus === 'Delivered') {
        const delivered = new Date(createdAt)
        delivered.setDate(delivered.getDate() + rand(2, 6))
        order.deliveredAt = delivered > new Date() ? new Date() : delivered
    }

    return order
}

const run = async () => {
    // find the connection string: known names first, then any variable whose value looks like a MongoDB URI
    const uri =
        process.env.DB_URI || process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_LOCAL_URI ||
        Object.values(process.env).find(v => typeof v === 'string' && /^mongodb(\+srv)?:\/\//.test(v))

    if (!uri) {
        console.error('No MongoDB connection string found in backend/config/.env.')
        console.error('Open config/database.js, see which variable it passes to mongoose.connect(), and set it above.')
        process.exit(1)
    }

    await mongoose.connect(uri)
    console.log('MongoDB connected')

    // remove earlier sample orders first (so you can re-run safely)
    const removed = await Order.deleteMany({ 'paymentInfo.id': /^SEED-/ })
    console.log(`Removed ${removed.deletedCount} earlier sample order(s)`)

    if (process.argv.includes('--delete')) {
        console.log('Done (delete only).')
        return
    }

    const users = await User.find()
    const products = await Product.find()

    if (users.length === 0) throw new Error('No users found. Seed or register users first.')
    if (products.length === 0) throw new Error('No products found. Seed products first.')

    const orders = Array.from({ length: ORDER_COUNT }, (_, i) => buildOrder(users, products, i))
    await Order.insertMany(orders)

    const total = orders.reduce((acc, o) => acc + o.totalPrice, 0)
    console.log(`Created ${orders.length} sample orders (total ${total.toFixed(2)}) using ${users.length} user(s) and ${products.length} product(s).`)
}

run()
    .catch(err => {
        console.error('Seeder failed:', err.message)
        process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
