product = require("../models/product");
class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        // http://localhost:5173?keyword=apple
        const keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        } : {}

        console.log(this.query, this.queryStr);
        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        // Express may parse bracketed query parameters as either flat keys or
        // nested objects, depending on the query parser configuration.
        const queryCopy = { ...this.queryStr };
        // console.log(queryCopy);
        // Removing fields from the query
        const removeFields = ['keyword', 'page']
        removeFields.forEach(el => delete queryCopy[el]);

        let priceFilter = {};
        const minimumPrice = queryCopy['price[gte]'] ?? queryCopy.price?.gte;
        const maximumPrice = queryCopy['price[lte]'] ?? queryCopy.price?.lte;
        if (minimumPrice !== undefined || maximumPrice !== undefined) {
            priceFilter.price = {};
            if (minimumPrice !== undefined) {
                priceFilter.price.$gte = Number(minimumPrice);
            }
            if (maximumPrice !== undefined) {
                priceFilter.price.$lte = Number(maximumPrice);
            }
        }
        delete queryCopy.price;
        delete queryCopy['price[gte]'];
        delete queryCopy['price[lte]'];

        // exact customer rating filter
        const selectedRating = queryCopy.rating ?? queryCopy['ratings[gte]'] ?? queryCopy.ratings?.gte;
        if (selectedRating !== undefined && selectedRating !== '') {
            const ratingValue = Number(selectedRating);
            if (Number.isFinite(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
                priceFilter.ratings = ratingValue === 5
                    ? 5
                    : { $gte: ratingValue, $lt: ratingValue + 1 };
            }
        }
        delete queryCopy.rating;
        delete queryCopy.ratings;
        delete queryCopy['ratings[gte]'];

        // category filter (from the category chips)
        if (queryCopy.category) {
            priceFilter.category = queryCopy.category;
        }

        this.query = this.query.find(priceFilter);
        return this;
    }

    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
}
module.exports = APIFeatures
