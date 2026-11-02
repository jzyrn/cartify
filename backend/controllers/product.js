const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');
const { maskReviewText, maskReviewComments, maskProductReviews } = require('../utils/reviewFilter')

const maskProductReviewsWithPurchasedVariants = async (product) => {
    const productData = typeof product.toObject === 'function' ? product.toObject() : { ...product }
    const orders = await Order.find({
        orderStatus: 'Delivered',
        'orderItems.product': productData._id,
    }).select('user orderItems').sort({ deliveredAt: -1, createdAt: -1 })

    const variantsByUser = new Map()
    for (const order of orders) {
        for (const item of order.orderItems || []) {
            const userId = String(order.user)
            if (
                String(item.product) === String(productData._id) &&
                item.shade &&
                !variantsByUser.has(userId)
            ) {
                variantsByUser.set(userId, item.shade)
            }
        }
    }

    productData.reviews = (productData.reviews || []).map((review) => {
        const reviewData = typeof review.toObject === 'function' ? review.toObject() : { ...review }
        reviewData.variant = reviewData.variant || variantsByUser.get(String(reviewData.user)) || ''
        return reviewData
    })

    return maskProductReviews(productData)
}

exports.newProduct = async (req, res, next) => {
    try {
        const uploadedFiles = req.files || []
        let images = uploadedFiles.map(file => file.path)

        // Keep accepting existing base64 image data from older clients.
        if (!images.length && typeof req.body.images === 'string') {
            images = [req.body.images]
        } else if (!images.length && Array.isArray(req.body.images)) {
            images = req.body.images
        }

        const imagesLinks = []
        for (const image of images) {
            const result = await cloudinary.v2.uploader.upload(image, {
                folder: 'products',
                resource_type: 'image',
            })
            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            })
        }

        req.body.images = imagesLinks
        const product = await Product.create(req.body);

        return res.status(201).json({
            success: true,
            product: maskProductReviews(product)
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: `Unable to create product: ${err.message}`
        })
    }
}

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product: await maskProductReviewsWithPurchasedVariants(product)
    })
}

exports.getProducts = async (req, res) => {

    const resPerPage = 4;
    const productsCount = await Product.countDocuments();

    // const products = await Product.find()
    const apiFeatures = new APIFeatures(Product.find(), req.query).search().filter()
    // .filter()

    // count the matches before paginating, so the page count is correct
    let filteredProductsCount = (await apiFeatures.query.clone()).length;

    apiFeatures.pagination(resPerPage);
    const products = await apiFeatures.query.clone();

    if (!products)
        return res.status(400).json({ message: 'error loading products' })
    return res.status(200).json({
        success: true,
        products: products.map(maskProductReviews),
        filteredProductsCount,
        resPerPage,
        productsCount,

    })
    // if (!products)
    //     return res.status(400).json({ message: 'error loading products' })

    // return res.status(200).json({
    //     success: true,
    //     products,
    //     resPerPage,
    //     productsCount,

    // })
}

exports.getProductBrands = async (req, res) => {
    const brands = await Product.distinct('brand');
    return res.status(200).json({ success: true, brands: brands.filter(Boolean).sort((a, b) => a.localeCompare(b)) });
}

exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            })
        }

        const uploadedFiles = req.files || []
        let newImages = uploadedFiles.map(file => file.path)
        if (!newImages.length && typeof req.body.images === 'string') {
            newImages = [req.body.images]
        } else if (!newImages.length && Array.isArray(req.body.images)) {
            newImages = req.body.images
        }

        const hasExistingImages = req.body.existingImages !== undefined
        let requestedImageIds = []
        if (hasExistingImages) {
            try {
                requestedImageIds = typeof req.body.existingImages === 'string'
                    ? JSON.parse(req.body.existingImages)
                    : req.body.existingImages
            } catch {
                return res.status(400).json({ success: false, message: 'Existing product images are invalid.' })
            }
            if (!Array.isArray(requestedImageIds) || requestedImageIds.some(imageId => typeof imageId !== 'string')) {
                return res.status(400).json({ success: false, message: 'Existing product images are invalid.' })
            }
        }
        delete req.body.existingImages

        if (newImages.length > 0 || hasExistingImages) {
            const requested = new Set(requestedImageIds)
            const retainedImages = hasExistingImages
                ? (product.images || []).filter(image => requested.has(typeof image === 'string' ? image : image.public_id || image.url))
                : []
            const uploadedImageLinks = []
            for (const image of newImages) {
                const result = await cloudinary.v2.uploader.upload(image, {
                    folder: 'products',
                    width: 150,
                    crop: 'scale',
                });
                uploadedImageLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url
                })
            }

            const retainedIds = new Set(retainedImages.map(image => typeof image === 'string' ? image : image.public_id || image.url))
            for (const image of product.images || []) {
                const imageId = typeof image === 'string' ? image : image.public_id || image.url
                if (!retainedIds.has(imageId) && typeof image !== 'string' && image.public_id) {
                    try {
                        await cloudinary.v2.uploader.destroy(image.public_id)
                    } catch (error) {
                        console.log(error)
                    }
                }
            }
            req.body.images = [...retainedImages, ...uploadedImageLinks]
        } else {
            delete req.body.images
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        })

        return res.status(200).json({
            success: true,
            product: maskProductReviews(product)
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: `Unable to update product: ${err.message}`
        })
    }
}

exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

// DELETE /admin/products/bulk  body: { ids: string[] }
exports.bulkDeleteProducts = async (req, res) => {
    const { ids } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0 || ids.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) {
        return res.status(400).json({ success: false, message: 'Provide one or more valid product IDs.' })
    }

    try {
        const result = await Product.deleteMany({ _id: { $in: [...new Set(ids)] } })
        return res.status(200).json({ success: true, deletedCount: result.deletedCount })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Could not delete selected products.' })
    }
}

exports.getAdminProducts = async (req, res, next) => {

    const products = await Product.find();
    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }
    return res.status(200).json({
        success: true,
        products: products.map(maskProductReviews)
    })

}

exports.createProductReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body
    const numericRating = Number(rating)
    const cleanComment = typeof comment === 'string' ? maskReviewText(comment.trim()) : ''

    if (!productId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5 || !cleanComment) {
        return res.status(400).json({ success: false, message: 'Please provide a rating from 1 to 5 and a review comment.' })
    }

    const product = await Product.findById(productId)
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const deliveredOrder = await Order.findOne({
        user: req.user._id,
        orderStatus: 'Delivered',
        'orderItems.product': product._id,
    }).sort({ deliveredAt: -1, createdAt: -1 })
    if (!deliveredOrder) {
        return res.status(403).json({ success: false, message: 'You can review this product after one of your orders containing it has been delivered.' })
    }

    const purchasedItem = (deliveredOrder.orderItems || []).find(
        item => String(item.product) === String(product._id)
    )
    const purchasedVariant = purchasedItem?.shade || ''

    product.reviews = product.reviews || []
    const existingReview = product.reviews.find(
        review => String(review.user) === String(req.user._id)
    )

    if (existingReview) {
        existingReview.comment = cleanComment
        existingReview.rating = numericRating
        existingReview.variant = purchasedVariant
        existingReview.name = req.user.name
        existingReview.isSeeded = false
    } else {
        product.reviews.push({
            user: req.user._id,
            name: req.user.name,
            rating: numericRating,
            variant: purchasedVariant,
            comment: cleanComment,
        })
    }

    product.numOfReviews = product.reviews.length
    product.ratings = product.numOfReviews
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numOfReviews
        : 0
    await product.save()

    return res.status(200).json({
        success: true,
        message: existingReview ? 'Your review was updated.' : 'Your review was added.',
        product: maskProductReviews(product),
    })
}

exports.getReviewEligibility = async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const hasDeliveredPurchase = await Order.exists({
        user: req.user._id,
        orderStatus: 'Delivered',
        'orderItems.product': product._id,
    })
    const existingReview = (product.reviews || []).find(
        review => String(review.user) === String(req.user._id)
    )

    return res.status(200).json({
        success: true,
        canReview: Boolean(hasDeliveredPurchase),
        hasReviewed: Boolean(existingReview),
    })
}

exports.getProductReviews = async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' })
    }
    res.status(200).json({
        success: true,
        reviews: maskReviewComments(product.reviews)
    })
}

exports.deleteReview = async (req, res, next) => {
    const { id, productId } = req.query
    if (!id || !productId) {
        return res.status(400).json({ success: false, message: 'Review ID and product ID are required.' })
    }

    try {
        // Pull the subdocument directly so unrelated product validation cannot
        // prevent an admin from removing a review.
        const result = await Product.updateOne(
            { _id: productId, 'reviews._id': id },
            { $pull: { reviews: { _id: id } } }
        )

        if (!result.modifiedCount) {
            const productExists = await Product.exists({ _id: productId })
            return res.status(404).json({
                success: false,
                message: productExists ? 'Review not found.' : 'Product not found.',
            })
        }

        const product = await Product.findById(productId).select('reviews.rating')
        const reviews = product?.reviews || []
        const numOfReviews = reviews.length
        const ratings = numOfReviews
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / numOfReviews
            : 0

        await Product.updateOne({ _id: productId }, { $set: { numOfReviews, ratings } })

        return res.status(200).json({ success: true })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Could not delete review.' })
    }
}

exports.productSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },

        },
    ])
    console.log(totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: true } },
        { $unwind: "$orderItems" },

        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
    console.log(sales)

    if (!totalSales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }
    if (!sales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }

    let totalPercentage = {}
    totalPercentage = sales.map(item => {

        // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number(((item.total / totalSales[0].total) * 100).toFixed(2))
        total = {
            name: item._id.product,
            percent
        }
        return total
    })
    console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}
