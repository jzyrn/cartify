// backend/seeder.js
// Run from the backend folder:  node prodseeder.js        (upserts the catalog)
//                               node prodseeder.js -d     (deletes all products)
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Product = require('./models/product')

dotenv.config({ path: 'config/.env' })

// p(category, brand, name, price in PHP, description, shades)
const p = (category, brand, name, price, description, shades = []) => ({
    category, brand, name, price, description, shades, stock: 50, ratings: 0, images: []
})

const FOUNDATION_SHADES = ['Fair', 'Light', 'Medium', 'Tan', 'Deep']
const CONCEALER_SHADES = ['Light', 'Medium', 'Tan', 'Deep']
const POWDER_SHADES = ['Light', 'Medium', 'Tan']

const products = [
    // ---------- Foundation ----------
    p('Foundation', 'Maybelline', 'Matte Liquid Foundation', 399, 'Lightweight liquid foundation with a soft matte finish and medium buildable coverage that lasts through the day.', FOUNDATION_SHADES),
    p('Foundation', 'Careline', 'Perfect Skin Foundation', 189, 'Smooth, blendable foundation that evens out skin tone and leaves a natural satin finish.', FOUNDATION_SHADES),
    p('Foundation', 'Happy Skin', 'Second Skin Foundation', 799, 'Skin-like foundation with a breathable, flexible formula for a fresh and healthy-looking complexion.', FOUNDATION_SHADES),
    p('Foundation', 'BLK Cosmetics', 'Soft Matte Foundation', 459, 'Full-coverage soft matte foundation made to blend seamlessly and stay put in warm weather.', FOUNDATION_SHADES),
    p('Foundation', 'Vice Cosmetics', 'Skin Perfecting Foundation', 349, 'Medium to full coverage foundation that blurs pores and minimizes the look of imperfections.', FOUNDATION_SHADES),
    p('Foundation', 'Pinkflash', 'Longwear Foundation', 269, 'Long-wearing, oil-control foundation that glides on smoothly with a velvety finish.', FOUNDATION_SHADES),

    // ---------- Concealer ----------
    p('Concealer', 'Dazzle Me', 'Full Cover Concealer', 149, 'Creamy, high-coverage concealer that hides dark circles, blemishes and redness without creasing.', CONCEALER_SHADES),
    p('Concealer', 'Sace Lady', 'Liquid Concealer', 159, 'Lightweight liquid concealer with a doe-foot applicator for precise, natural-looking coverage.', CONCEALER_SHADES),
    p('Concealer', 'Colourette', 'Cover Up Concealer', 450, 'Buildable concealer that brightens the under-eye area and covers spots with a smooth finish.', CONCEALER_SHADES),
    p('Concealer', 'Wet n Wild', 'Photo Focus Concealer', 249, 'Hydrating concealer with a natural finish that blends easily for an even, camera-ready look.', CONCEALER_SHADES),
    p('Concealer', 'Maybelline', 'Instant Age Rewind Concealer', 449, 'Concealer with a soft sponge applicator that covers dark circles while keeping the eye area comfortable.', CONCEALER_SHADES),
    p('Concealer', 'Happy Skin', 'Second Skin Concealer', 599, 'Lightweight, skin-like concealer with medium buildable coverage and a seamless blend.', CONCEALER_SHADES),

    // ---------- Powder ----------
    p('Powder', 'Careline', 'Compact Powder', 129, 'Pressed powder that controls shine and sets makeup for a smooth, natural matte look.', POWDER_SHADES),
    p('Powder', 'Pinkflash', 'Oil Control Setting Powder', 229, 'Finely milled setting powder that keeps the T-zone matte and makeup in place for hours.', POWDER_SHADES),
    p('Powder', 'Vice Cosmetics', 'Loose Setting Powder', 299, 'Silky loose powder that sets foundation and concealer while leaving a soft-focus finish.', POWDER_SHADES),
    p('Powder', 'BLK Cosmetics', 'Translucent Pressed Powder', 399, 'Lightweight translucent powder that sets makeup without adding color or looking cakey.', ['Translucent']),
    p('Powder', 'Sace Lady', 'Two-Way Cake Powder', 179, 'Two-way powder for dry touch-ups or wet application when you want more coverage.', POWDER_SHADES),
    p('Powder', 'Wet n Wild', 'Photo Focus Setting Powder', 299, 'Setting powder that blurs the look of pores and gives skin a smooth, camera-ready finish.', ['Translucent']),

    // ---------- Blush & Highlighter ----------
    p('Blush & Highlighter', 'Colourette', 'Cheeky Blush', 350, 'Soft, pigmented blush that blends easily for a natural flush of color on the cheeks.', ['Peach', 'Coral', 'Rose', 'Berry']),
    p('Blush & Highlighter', 'Dazzle Me', 'Blush On Palette', 189, 'Palette of pigmented blushes that can be worn alone or layered to build color.', ['Peach', 'Pink', 'Berry']),
    p('Blush & Highlighter', 'Happy Skin', 'Cheek Tint', 499, 'Lightweight cream tint that gives cheeks and lips a fresh, dewy wash of color.', ['Rose', 'Coral', 'Plum']),
    p('Blush & Highlighter', 'Pinkflash', 'Glow Highlighter', 249, 'Finely milled highlighter that adds a smooth, luminous glow to cheekbones and brow bones.', ['Champagne', 'Pearl', 'Gold']),
    p('Blush & Highlighter', 'Maybelline', 'Face Studio Blush', 399, 'Silky powder blush with buildable color and a soft, natural finish.', ['Pink', 'Peach', 'Berry']),
    p('Blush & Highlighter', 'Careline', 'Blush & Highlight Duo', 169, 'Two-in-one compact with a blush and highlighter for quick, everyday face definition.', ['Pink Glow', 'Peach Glow']),

    // ---------- Eyeshadow ----------
    p('Eyeshadow', 'Vice Cosmetics', 'Eyeshadow Palette', 499, 'Palette of matte and shimmer shades in versatile tones for everyday and evening eye looks.', ['Neutrals', 'Warm Browns', 'Rosy Mauves']),
    p('Eyeshadow', 'Sace Lady', '12-Color Eyeshadow Palette', 249, 'Twelve blendable shades with a mix of mattes and shimmers in one portable palette.', ['Nude', 'Smokey']),
    p('Eyeshadow', 'BLK Cosmetics', 'Pressed Pigment Eyeshadow', 349, 'Highly pigmented pressed eyeshadow with smooth application and long-lasting color.', ['Bronze', 'Mocha', 'Plum']),
    p('Eyeshadow', 'Dazzle Me', 'Shimmer Eyeshadow Quad', 179, 'Four coordinating shimmer shades that build from a soft wash to a bold, glittery eye.', ['Gold Rush', 'Rose Gold', 'Bronze']),
    p('Eyeshadow', 'Wet n Wild', 'Color Icon Eyeshadow Palette', 299, 'Pigmented palette with matte and shimmer finishes for easy day-to-night eye looks.', ['Nude Awakening', 'Petal Pusher']),
    p('Eyeshadow', 'Colourette', 'Eyeshadow Palette', 650, 'Richly pigmented palette with creamy mattes and metallics that blend without fallout.', ['Neutral', 'Sunset']),

    // ---------- Eyeliner & Mascara ----------
    p('Eyeliner & Mascara', 'Maybelline', 'Volum\' Express Mascara', 349, 'Volumizing mascara that adds lift and thickness to lashes without clumping.', ['Black']),
    p('Eyeliner & Mascara', 'Careline', 'Waterproof Eyeliner', 99, 'Smudge-proof liquid eyeliner with a fine tip for crisp lines and a bold wing.', ['Black', 'Brown']),
    p('Eyeliner & Mascara', 'Pinkflash', 'Curling Mascara', 199, 'Long-wearing mascara with a curved brush that lifts and defines lashes all day.', ['Black']),
    p('Eyeliner & Mascara', 'Happy Skin', 'Gel Eyeliner Pencil', 449, 'Creamy gel pencil that glides on smoothly and sets to a long-lasting, smudge-resistant finish.', ['Black', 'Brown', 'Navy']),
    p('Eyeliner & Mascara', 'Dazzle Me', 'Lengthening Mascara', 149, 'Lengthening mascara that separates and extends lashes for a wide-awake look.', ['Black']),
    p('Eyeliner & Mascara', 'Wet n Wild', 'Liquid Eyeliner', 199, 'Precision-tip liquid liner for easy, controlled lines in a deep, matte color.', ['Black', 'Brown']),

    // ---------- Lipstick & Lip Tint ----------
    p('Lipstick & Lip Tint', 'Sace Lady', 'Matte Lipstick', 139, 'Creamy matte lipstick with rich color payoff and a comfortable, non-drying feel.', ['Nude Pink', 'Coral', 'Red', 'Berry']),
    p('Lipstick & Lip Tint', 'Colourette', 'Lip Tint', 350, 'Smooth, buildable lip tint with a soft-matte finish that stays on for hours.', ['Rose', 'Peach', 'Cherry', 'Mauve']),
    p('Lipstick & Lip Tint', 'Careline', 'Velvet Lipstick', 119, 'Velvety lipstick that glides on smoothly and delivers bold color in one swipe.', ['Nude', 'Pink', 'Red']),
    p('Lipstick & Lip Tint', 'Vice Cosmetics', 'Liquid Lipstick', 299, 'Lightweight liquid lipstick that dries to a velvet-matte finish with long-lasting wear.', ['Nude', 'Rosewood', 'Red', 'Plum']),
    p('Lipstick & Lip Tint', 'BLK Cosmetics', 'Lip Tint Stain', 329, 'Water-based stain that leaves a natural, lived-in flush of color on the lips.', ['Cherry', 'Peach', 'Berry']),
    p('Lipstick & Lip Tint', 'Maybelline', 'Superstay Matte Ink', 449, 'Long-lasting liquid lipstick with a smooth matte finish and intense color.', ['Pink', 'Coral', 'Red', 'Brown']),

    // ---------- Brows ----------
    p('Brows', 'Pinkflash', 'Brow Pencil', 129, 'Slim brow pencil with a spoolie for natural-looking strokes and defined arches.', ['Dark Brown', 'Medium Brown', 'Light Brown']),
    p('Brows', 'Happy Skin', 'Brow Pomade', 499, 'Creamy pomade that fills sparse areas and sculpts brows with long-lasting definition.', ['Dark Brown', 'Medium Brown', 'Soft Brown']),
    p('Brows', 'Dazzle Me', 'Brow Gel', 159, 'Tinted brow gel that tames hairs and adds subtle color for a fuller, groomed look.', ['Brown', 'Dark Brown']),
    p('Brows', 'Wet n Wild', 'Ultimate Brow Retractable Pencil', 249, 'Retractable pencil with a fine tip and brush for precise strokes and easy blending.', ['Taupe', 'Medium Brown', 'Dark Brown']),
    p('Brows', 'Sace Lady', 'Eyebrow Powder Duo', 149, 'Two-shade powder kit with a brush for soft, natural brow shaping and filling.', ['Brown', 'Dark Brown']),
    p('Brows', 'BLK Cosmetics', 'Brow Definer', 299, 'Waterproof brow definer that draws fine hair-like strokes and stays put all day.', ['Blonde', 'Brown', 'Black']),
]

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.DB_LOCAL_URI)

        if (process.argv.includes('-d')) {
            const result = await Product.deleteMany()
            console.log(`${result.deletedCount} products deleted`)
            return
        }

        const operations = products.map(product => ({
            updateOne: {
                // Keep the same MongoDB _id so existing order item references remain valid.
                filter: { name: product.name, brand: product.brand },
                update: {
                    $set: {
                        name: product.name,
                        brand: product.brand,
                        category: product.category,
                        price: product.price,
                        description: product.description,
                        shades: product.shades,
                    },
                    // Defaults apply only to new catalog entries; reseeding won't reset stock/images/reviews.
                    $setOnInsert: {
                        stock: product.stock,
                        ratings: product.ratings,
                        numOfReviews: 0,
                        images: product.images,
                    },
                },
                upsert: true,
            },
        }))
        const result = await Product.bulkWrite(operations)
        console.log(`Catalog synced: ${result.upsertedCount} added, ${result.modifiedCount} updated; existing product IDs preserved.`)
    } catch (error) {
        console.log(error.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

seedProducts()
