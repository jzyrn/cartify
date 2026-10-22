const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');

exports.newProduct = async (req, res, next) => {
    let images = []
    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else if (Array.isArray(req.body.images)) {
        images = req.body.images
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        try {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: 'products',
                width: 150,
                crop: "scale",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })

        } catch (error) {
            console.log(error)
        }
    }

    req.body.images = imagesLinks
    try {
        const product = await Product.create(req.body);

        return res.status(201).json({
            success: true,
            product
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
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
        product
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
        products,
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
        let images = []
        if (uploadedFiles.length > 0) {
            images = uploadedFiles.map(file => file.path)
        } else if (typeof req.body.images === 'string') {
            images.push(req.body.images)
        } else if (Array.isArray(req.body.images)) {
            images = req.body.images
        }

        if (images.length > 0) {
            let imagesLinks = [];
            for (let i = 0; i < images.length; i++) {
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: 'products',
                    width: 150,
                    crop: "scale",
                });
                imagesLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url
                })
            }

            for (let i = 0; i < (product.images || []).length; i++) {
                try {
                    await cloudinary.v2.uploader.destroy(product.images[i].public_id)
                } catch (error) {
                    console.log(error)
                }
            }
            req.body.images = imagesLinks
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
            product
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
        products
    })

}

exports.createProductReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body
    const numericRating = Number(rating)
    const cleanComment = typeof comment === 'string' ? comment.trim() : ''

    if (!productId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5 || !cleanComment) {
        return res.status(400).json({ success: false, message: 'Please provide a rating from 1 to 5 and a review comment.' })
    }

    const product = await Product.findById(productId)
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const hasDeliveredPurchase = await Order.exists({
        user: req.user._id,
        orderStatus: 'Delivered',
        'orderItems.product': product._id,
    })
    if (!hasDeliveredPurchase) {
        return res.status(403).json({ success: false, message: 'You can review this product after one of your orders containing it has been delivered.' })
    }

    product.reviews = product.reviews || []
    const existingReview = product.reviews.find(
        review => String(review.user) === String(req.user._id)
    )

    if (existingReview) {
        existingReview.comment = cleanComment
        existingReview.rating = numericRating
        existingReview.name = req.user.name
        existingReview.isSeeded = false
    } else {
        product.reviews.push({
            user: req.user._id,
            name: req.user.name,
            rating: numericRating,
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
        product,
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
        reviews: product.reviews
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
