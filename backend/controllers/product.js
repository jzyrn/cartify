// Paste these two functions over exports.newProduct and exports.updateProduct
// in backend/controllers/product.js. Everything else in that file stays the same.

exports.newProduct = async (req, res, next) => {
    // one image arrives as a string, several as an array, none as undefined
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

exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    // one image arrives as a string, several as an array, none as undefined
    let images = []
    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else if (Array.isArray(req.body.images)) {
        images = req.body.images
    }

    if (images.length > 0) {
        // new images were chosen: remove the old ones from cloudinary, then upload the new ones
        for (let i = 0; i < (product.images || []).length; i++) {
            try {
                await cloudinary.v2.uploader.destroy(product.images[i].public_id)
            } catch (error) {
                console.log(error)
            }
        }

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
        req.body.images = imagesLinks
    } else {
        // no new images: keep the current ones
        delete req.body.images
    }

    try {
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
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}