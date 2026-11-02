const { Filter } = require('bad-words')

const profanityFilter = new Filter({ placeHolder: '*' })

const maskReviewText = (text) => {
    if (typeof text !== 'string') return text
    return profanityFilter.clean(text)
}

const maskReviewComments = (reviews = []) => reviews.map((review) => {
    const reviewData = typeof review.toObject === 'function' ? review.toObject() : { ...review }
    reviewData.comment = maskReviewText(reviewData.comment || '')
    return reviewData
})

const maskProductReviews = (product) => {
    if (!product) return product
    const productData = typeof product.toObject === 'function' ? product.toObject() : { ...product }
    productData.reviews = maskReviewComments(productData.reviews)
    return productData
}

module.exports = { maskReviewText, maskReviewComments, maskProductReviews }
