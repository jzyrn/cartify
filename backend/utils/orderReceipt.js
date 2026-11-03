const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const COLORS = {
    green: [23, 51, 42],
    greenSoft: [238, 243, 240],
    gold: [201, 162, 39],
    ink: [39, 52, 46],
    muted: [101, 116, 108],
    line: [224, 232, 227],
    white: [255, 255, 255],
}

const pdfText = value => String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const money = amount => `PHP ${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const customerStatus = status => status === 'Processing' || status === 'Preparing' ? 'Being processed' : status
const deliveryHeading = status => ({
    Pending: 'DELIVERY ADDRESS',
    Processing: 'BEING PROCESSED FOR DELIVERY TO',
    Preparing: 'BEING PROCESSED FOR DELIVERY TO',
    Shipped: 'SHIPPED TO',
    Delivered: 'DELIVERED TO',
    Cancelled: 'DELIVERY ADDRESS',
}[status] || 'DELIVERY ADDRESS')
const color = (rgb, stroke = false) => `${rgb.map(value => (value / 255).toFixed(3)).join(' ')} ${stroke ? 'RG' : 'rg'}`

const wrap = (value, max = 48) => {
    const words = String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').split(/\s+/)
    const lines = []
    let line = ''
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word
        if (candidate.length > max && line) {
            lines.push(line)
            line = word
        } else line = candidate
    }
    if (line) lines.push(line)
    return lines.length ? lines : ['']
}

// Decode the Cartify PNG into RGB and alpha streams for embedding in the PDF.
// Supports the standard 8-bit RGB/RGBA and grayscale PNG formats used by the logo.
const readPng = filePath => {
    const png = fs.readFileSync(filePath)
    if (png.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error('Cartify logo is not a valid PNG')

    let width, height, bitDepth, colorType
    const dataChunks = []
    for (let offset = 8; offset < png.length;) {
        const length = png.readUInt32BE(offset)
        const type = png.toString('ascii', offset + 4, offset + 8)
        const data = png.subarray(offset + 8, offset + 8 + length)
        if (type === 'IHDR') {
            width = data.readUInt32BE(0)
            height = data.readUInt32BE(4)
            bitDepth = data[8]
            colorType = data[9]
        } else if (type === 'IDAT') dataChunks.push(data)
        else if (type === 'IEND') break
        offset += length + 12
    }

    const channelsByType = { 0: 1, 2: 3, 4: 2, 6: 4 }
    const channels = channelsByType[colorType]
    if (!channels || bitDepth !== 8) throw new Error('Cartify logo PNG format is not supported in the PDF receipt')

    const decoded = zlib.inflateSync(Buffer.concat(dataChunks))
    const stride = width * channels
    const pixels = Buffer.alloc(height * stride)
    const paeth = (a, b, c) => {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
    }
    let input = 0
    for (let y = 0; y < height; y++) {
        const filter = decoded[input++]
        const rowStart = y * stride
        for (let x = 0; x < stride; x++) {
            const raw = decoded[input++]
            const left = x >= channels ? pixels[rowStart + x - channels] : 0
            const above = y ? pixels[rowStart + x - stride] : 0
            const upperLeft = y && x >= channels ? pixels[rowStart + x - stride - channels] : 0
            let predictor = 0
            if (filter === 1) predictor = left
            else if (filter === 2) predictor = above
            else if (filter === 3) predictor = Math.floor((left + above) / 2)
            else if (filter === 4) predictor = paeth(left, above, upperLeft)
            else if (filter !== 0) throw new Error('Cartify logo PNG uses an unsupported filter')
            pixels[rowStart + x] = (raw + predictor) & 255
        }
    }

    const rgb = Buffer.alloc(width * height * 3)
    const alpha = colorType === 4 || colorType === 6 ? Buffer.alloc(width * height) : null
    for (let pixel = 0; pixel < width * height; pixel++) {
        const src = pixel * channels
        const dst = pixel * 3
        if (colorType === 0 || colorType === 4) rgb[dst] = rgb[dst + 1] = rgb[dst + 2] = pixels[src]
        else {
            rgb[dst] = pixels[src]
            rgb[dst + 1] = pixels[src + 1]
            rgb[dst + 2] = pixels[src + 2]
        }
        if (alpha) alpha[pixel] = pixels[src + channels - 1]
    }
    return { width, height, rgb: zlib.deflateSync(rgb), alpha: alpha && zlib.deflateSync(alpha) }
}

const streamObject = (dictionary, data) => Buffer.concat([
    Buffer.from(`<< ${dictionary} /Length ${data.length} >>\nstream\n`, 'binary'),
    data,
    Buffer.from('\nendstream', 'binary'),
])

const buildPageCommands = (order, user, pageIndex, pageCount, logo) => {
    const commands = []
    const rect = (x, y, w, h, fill) => commands.push(`${color(fill)} ${x} ${y} ${w} ${h} re f`)
    const rule = (x1, y1, x2, y2, stroke = COLORS.line, width = 0.8) => commands.push(`${color(stroke, true)} ${width} w ${x1} ${y1} m ${x2} ${y2} l S`)
    const text = (value, x, y, size = 9, fill = COLORS.ink, font = 'F1') => {
        commands.push(`BT /${font} ${size} Tf ${color(fill)} ${x} ${y} Td (${pdfText(value)}) Tj ET`)
    }

    rect(0, 755, 612, 87, COLORS.green)
    rect(0, 752, 612, 3, COLORS.gold)
    if (logo) {
        const logoWidth = Math.min(134, 48 * logo.width / logo.height)
        commands.push(`q ${logoWidth} 0 0 48 42 774 cm /Logo Do Q`)
    } else {
        text('CARTIFY', 42, 790, 20, COLORS.white, 'F2')
    }
    text('YOUR ORDER, BEAUTIFULLY WRAPPED', 42, 761, 6, [224, 232, 227])
    text('ORDER RECEIPT', 430, 800, 9, COLORS.white, 'F2')
    text(`#${String(order._id).slice(-10).toUpperCase()}`, 430, 783, 8, [224, 232, 227])

    if (pageIndex === 0) {
        text('Thank you for choosing Cartify.', 42, 724, 16, COLORS.green, 'F2')
        text('We appreciate your order. Here is your transaction summary.', 42, 706, 9, COLORS.muted)

        rect(42, 625, 528, 62, COLORS.greenSoft)
        text('ORDER DETAILS', 56, 671, 8, COLORS.green, 'F2')
        text(`Order ID: ${order._id}`, 56, 652, 8, COLORS.ink)
        text(`Placed: ${new Date(order.createdAt || Date.now()).toLocaleString('en-PH')}`, 56, 636, 8, COLORS.ink)
        text(`Status: ${customerStatus(order.orderStatus)}`, 354, 652, 8, COLORS.ink)
        const paymentStatus = order.paymentInfo?.status === 'succeeded' || order.paymentInfo?.id?.startsWith('CARD-') ? 'Paid' : 'Pay on delivery'
        text(`Payment: ${paymentStatus} (${order.paymentInfo?.id || 'COD'})`, 354, 636, 8, COLORS.ink)

        rect(42, 505, 528, 96, COLORS.greenSoft)
        rule(306, 505, 306, 601)
        text('CUSTOMER', 56, 584, 7, COLORS.green, 'F2')
        text(deliveryHeading(order.orderStatus), 322, 584, 7, COLORS.green, 'F2')
        text(user?.name || 'Customer', 56, 568, 8, COLORS.ink, 'F2')
        wrap(user?.email || '', 36).slice(0, 2).forEach((line, index) => text(line, 56, 554 - index * 10, 7, COLORS.ink))
        text(`Phone: ${order.shippingInfo?.phoneNo || 'Not provided'}`, 56, 530, 7, COLORS.muted)

        const address = [order.shippingInfo?.address, order.shippingInfo?.city, order.shippingInfo?.postalCode, order.shippingInfo?.country]
            .filter(Boolean).join(', ')
        wrap(address, 36).slice(0, 3).forEach((line, index) => text(line, 322, 568 - index * 10, 7, COLORS.ink))
        text(`Phone: ${order.shippingInfo?.phoneNo || 'Not provided'}`, 322, 530, 7, COLORS.muted)
    } else {
        text(`Order #${order._id} - continued`, 42, 724, 13, COLORS.green, 'F2')
    }

    const tableTop = pageIndex === 0 ? 478 : 690
    rect(42, tableTop - 22, 528, 22, COLORS.greenSoft)
    text('PRODUCT / VARIANT', 54, tableTop - 14, 8, COLORS.green, 'F2')
    text('QTY', 358, tableTop - 14, 8, COLORS.green, 'F2')
    text('UNIT PRICE', 407, tableTop - 14, 8, COLORS.green, 'F2')
    text('LINE TOTAL', 497, tableTop - 14, 8, COLORS.green, 'F2')
    return { commands, tableY: tableTop - 22, rect, rule, text }
}

const createOrderReceipt = (order, user = order.user) => {
    // The backend is deployed separately from the frontend, so its receipt
    // must not depend on an asset inside the frontend repository.
    const logoPath = path.join(__dirname, '../assets/cartify_logo.png')
    const logo = fs.existsSync(logoPath) ? readPng(logoPath) : null
    const items = order.orderItems || []
    const objects = []
    const addObject = value => {
        objects.push(Buffer.isBuffer(value) ? value : Buffer.from(value, 'binary'))
        return objects.length
    }

    const catalogId = addObject('')
    const pagesId = addObject('')
    const regularFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
    let logoId
    if (logo) {
        let alphaId
        if (logo.alpha) {
            alphaId = addObject(streamObject(`/Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode`, logo.alpha))
        }
        logoId = addObject(streamObject(`/Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode${alphaId ? ` /SMask ${alphaId} 0 R` : ''}`, logo.rgb))
    }

    const pageContents = []
    let pageIndex = -1
    let page
    const beginPage = () => {
        pageIndex += 1
        page = buildPageCommands(order, user, pageIndex, 1, logo)
        pageContents.push(page.commands)
    }
    beginPage()

    for (const item of items) {
        const productName = item.name || 'Product'
        const variant = item.shade ? `Variant: ${item.shade}` : 'Variant: Standard'
        const nameLines = wrap(productName, 40)
        const variantLines = wrap(variant, 40)
        const rowHeight = Math.max(34, (nameLines.length + variantLines.length) * 10 + 8)
        if (page.tableY - rowHeight < 96) {
            beginPage()
        }
        const top = page.tableY
        const detailLines = [...nameLines, ...variantLines]
        detailLines.forEach((line, index) => page.text(line, 54, top - 13 - index * 10, index === 0 ? 8 : 7, index === 0 ? COLORS.ink : COLORS.muted, index === 0 ? 'F2' : 'F1'))
        page.text(String(item.quantity || 0), 366, top - 18, 8, COLORS.ink)
        page.text(money(item.price), 407, top - 18, 7, COLORS.ink)
        page.text(money(Number(item.price || 0) * Number(item.quantity || 0)), 497, top - 18, 7, COLORS.ink)
        page.rule(42, top - rowHeight, 570, top - rowHeight)
        page.tableY = top - rowHeight
    }

    if (page.tableY < 185) beginPage()
    let summaryY = page.tableY - 26
    const summaryX = 358
    const summaryRight = 558
    const summaryRow = (label, value, strong = false) => {
        page.text(label, summaryX, summaryY, 9, strong ? COLORS.green : COLORS.muted, strong ? 'F2' : 'F1')
        page.text(value, summaryRight - Math.min(value.length * (strong ? 5.4 : 4.8), 124), summaryY, 9, strong ? COLORS.green : COLORS.ink, strong ? 'F2' : 'F1')
        summaryY -= 18
    }
    summaryRow('Subtotal', money(order.itemsPrice))
    summaryRow('Shipping', money(order.shippingPrice))
    summaryRow('Tax', money(order.taxPrice))
    summaryY -= 8
    page.rule(summaryX, summaryY + 12, 570, summaryY + 12, COLORS.gold, 1.5)
    summaryRow('GRAND TOTAL', money(order.totalPrice), true)

    page.rule(42, 70, 570, 70, COLORS.line)
    page.text('Thank you for shopping with Cartify. We hope you love your order!', 42, 52, 8, COLORS.green, 'F2')
    page.text(`Need help? Contact us and include order #${String(order._id).slice(-10)}.`, 42, 38, 7, COLORS.muted)
    page.text(`Page ${pageIndex + 1}`, 535, 38, 7, COLORS.muted)

    const pageIds = []
    for (const commands of pageContents) {
        const stream = Buffer.from(commands.join('\n'), 'binary')
        const contentId = addObject(streamObject('', stream))
        const xObjectResources = logoId ? `/XObject << /Logo ${logoId} 0 R >>` : ''
        const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> ${xObjectResources} >> /Contents ${contentId} 0 R >>`)
        pageIds.push(pageId)
    }
    objects[catalogId - 1] = Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`, 'binary')
    objects[pagesId - 1] = Buffer.from(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`, 'binary')

    const header = Buffer.from('%PDF-1.4\n%PDF\n', 'binary')
    const body = [header]
    const offsets = [0]
    let length = header.length
    objects.forEach((object, index) => {
        offsets.push(length)
        const prefix = Buffer.from(`${index + 1} 0 obj\n`, 'binary')
        const suffix = Buffer.from('\nendobj\n', 'binary')
        body.push(prefix, object, suffix)
        length += prefix.length + object.length + suffix.length
    })
    const xrefOffset = length
    const xref = [`xref\n0 ${objects.length + 1}\n`, '0000000000 65535 f \n']
    offsets.slice(1).forEach(offset => xref.push(`${String(offset).padStart(10, '0')} 00000 n \n`))
    xref.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)
    body.push(Buffer.from(xref.join(''), 'binary'))
    return Buffer.concat(body)
}

module.exports = createOrderReceipt
