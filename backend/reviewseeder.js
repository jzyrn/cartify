// Seed sample reviews only for products in delivered customer orders.
//
//   node reviewseeder.js          -> add sample reviews (safe to rerun)
//   node reviewseeder.js --delete -> remove only reviews created by this seeder

const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config({ path: path.join(__dirname, 'config', '.env') })

const Order = require('./models/order')
const Product = require('./models/product')
require('./models/user') // Register User before populating order.user.

const COMMENTS = [
    'The shade looks lovely and the product feels comfortable to wear.',
    'Good quality for everyday use. I would purchase this again.',
    'The color matched the description and applied smoothly.',
    'A nice addition to my routine. The packaging arrived in good condition.',
    'Easy to use and the finish lasted through the day.',
]

const ratingFor = (index) => [5, 4, 5, 4, 3][index % 5]

const recalculateProduct = (product) => {
    product.numOfReviews = product.reviews.length
    product.ratings = product.numOfReviews
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numOfReviews
        : 0
}

const run = async () => {
    const uri = process.env.DB_URI || process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_LOCAL_URI ||
        Object.values(process.env).find(value => typeof value === 'string' && /^mongodb(\+srv)?:\/\//.test(value))

    if (!uri) throw new Error('No MongoDB connection string found in backend/config/.env.')

    await mongoose.connect(uri)
    console.log('MongoDB connected')

    if (process.argv.includes('--delete')) {
        const products = await Product.find({ 'reviews.isSeeded': true })
        let removed = 0
        for (const product of products) {
            const before = product.reviews.length
            product.reviews = product.reviews.filter(review => !review.isSeeded)
            removed += before - product.reviews.length
            recalculateProduct(product)
            await product.save()
        }
        console.log(`Removed ${removed} seeded review(s).`)
        return
    }

    const orders = await Order.find({ orderStatus: 'Delivered' }).populate('user', 'name')
    if (orders.length === 0) {
        console.log('No delivered orders found, so there are no verified purchases to seed reviews for.')
        console.log('Run `node orderseeder.js` first to create sample delivered orders, then run `node reviewseeder.js` again.')
        return
    }

    const productIds = [...new Set(orders.flatMap(order =>
        (order.orderItems || []).map(item => String(item.product))
    ))]
    const products = await Product.find({ _id: { $in: productIds } })
    const productsById = new Map(products.map(product => [String(product._id), product]))
    const reviewedPairs = new Set()
    let added = 0
    let skippedExisting = 0
    let missingProducts = 0

    for (const order of orders) {
        if (!order.user) continue
        for (const item of order.orderItems || []) {
            const product = productsById.get(String(item.product))
            if (!product) {
                missingProducts += 1
                continue
            }

            const pair = `${order.user._id}:${product._id}`
            if (reviewedPairs.has(pair)) continue
            reviewedPairs.add(pair)

            product.reviews = product.reviews || []
            const existing = product.reviews.find(review => String(review.user) === String(order.user._id))
            if (existing) {
                skippedExisting += 1
                continue // Never replace a customer's real review.
            }

            const index = added
            product.reviews.push({
                user: order.user._id,
                name: order.user.name || 'Cartify Customer',
                rating: ratingFor(index),
                comment: COMMENTS[index % COMMENTS.length],
                isSeeded: true,
            })
            recalculateProduct(product)
            added += 1
        }
    }

    for (const product of products) {
        if (product.isModified()) await product.save()
    }
    console.log(`Found ${orders.length} delivered order(s); added ${added} review(s).`)
    if (skippedExisting > 0) console.log(`Skipped ${skippedExisting} customer/product pair(s) that already have a review.`)
    if (missingProducts > 0) console.log(`Skipped ${missingProducts} order item(s) whose product no longer exists.`)
    console.log('Re-running will not duplicate reviews.')
}

run()
    .catch(error => {
        console.error('Review seeder failed:', error.message)
        process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
