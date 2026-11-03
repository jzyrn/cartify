const User = require('../models/user')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')
const cloudinary = require('cloudinary')
const sendToken = require('../utils/jwtToken')

// POST /api/v1/register
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        // role is NOT taken from the body, so nobody can register as admin
        const user = await User.create({ name, email, password })
        sendToken(user, 201, res)
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'That email is already registered' })
        }
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(e => e.message).join(', ')
            return res.status(400).json({ success: false, message })
        }
        res.status(500).json({ success: false, message: err.message })
    }
}

// POST /api/v1/login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please enter email and password' })
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
        const matched = user && await user.comparePassword(password)

        // same message for both cases so nobody can tell which emails exist
        if (!matched) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' })
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator to reactivate it.' })
        }

        sendToken(user, 200, res)
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}

// ---------------------------------------------------------------------
// SOCIAL LOGIN (Google via Firebase)
// ---------------------------------------------------------------------

// Logs the person in. If nobody has this email yet, an account is created.
const loginOrCreateSocial = async (res, { email, name, picture, provider, providerId }) => {
    const lowerEmail = email.toLowerCase()
    let user = await User.findOne({ email: lowerEmail })

    if (user && !user.isActive) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator to reactivate it.' })
    }

    if (!user) {
        user = await User.create({
            name: name || lowerEmail.split('@')[0],
            email: lowerEmail,
            // social accounts never use this, but the model needs a password
            password: crypto.randomBytes(32).toString('hex'),
            avatar: {
                public_id: `${provider}_${providerId}`,
                url: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || lowerEmail)}`
            }
        })
    }

    // same cookie the normal login sets
    sendToken(user, 200, res)
}

// POST /api/v1/auth/firebase   body: { idToken }
// Google sign-in done on the frontend with Firebase Authentication
exports.firebaseLogin = async (req, res) => {
    try {
        const { idToken } = req.body
        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Missing Google token' })
        }

        // ask Firebase whether this ID token is real (no extra package needed)
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            }
        )
        const data = await response.json()

        if (!response.ok || !data.users || data.users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid Google sign-in' })
        }

        const fbUser = data.users[0]
        if (!fbUser.email || !fbUser.emailVerified) {
            return res.status(401).json({ success: false, message: 'Your Google email is not verified' })
        }

        await loginOrCreateSocial(res, {
            email: fbUser.email,
            name: fbUser.displayName,
            picture: fbUser.photoUrl,
            provider: 'firebase',
            providerId: fbUser.localId
        })
    } catch (err) {
        const message = err.name === 'ValidationError' ? err.message : 'Google sign-in failed. Please try again.'
        res.status(500).json({ success: false, message })
    }
}

// GET /api/v1/logout
exports.logout = (req, res) => {
    const isProduction = String(process.env.NODE_ENV).toLowerCase() === 'production'
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    })
    res.status(200).json({ success: true, message: 'Logged out' })
}

// GET /api/v1/me
exports.getUserProfile = (req, res) => {
    res.status(200).json({ success: true, user: req.user })
}

// PUT /api/v1/me/update
exports.updateProfile = async (req, res) => {
    try {
        const body = req.body || {}
        const newData = { name: body.name, email: body.email }

        // only touch the avatar when a new image was chosen
        if (body.avatar) {
            const current = await User.findById(req.user.id)
            if (current.avatar?.public_id) {
                await cloudinary.v2.uploader.destroy(current.avatar.public_id)
            }
            const result = await cloudinary.v2.uploader.upload(body.avatar, {
                folder: 'avatars',
                width: 150,
                crop: 'scale'
            })
            newData.avatar = { public_id: result.public_id, url: result.secure_url }
        }

        const user = await User.findByIdAndUpdate(req.user.id, newData, {
            new: true,
            runValidators: true
        })
        res.status(200).json({ success: true, user })
    } catch (err) {
        console.log('updateProfile error:', err.message)
        res.status(400).json({ success: false, message: err.message })
    }
}

// PUT /api/v1/password/update
exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword } = req.body
        // the professor's page sends "password", other clients may send "newPassword"
        const newPassword = req.body.password || req.body.newPassword

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please enter old and new password' })
        }

        const user = await User.findById(req.user.id).select('+password')

        if (!(await user.comparePassword(oldPassword))) {
            return res.status(400).json({ success: false, message: 'Old password is incorrect' })
        }

        user.password = newPassword
        await user.save() // pre-save hook hashes it
        sendToken(user, 200, res)
    } catch (err) {
        res.status(400).json({ success: false, message: err.message })
    }
}

// POST /api/v1/password/forgot
exports.forgotPassword = async (req, res) => {
    // same answer whether or not the email exists, so nobody can check who is registered
    const reply = { success: true, message: 'If that email is registered, a reset link has been sent' }

    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() })
    if (!user) return res.status(200).json(reply)

    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    const frontend = (process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5173').replace(/\/+$/, '')
    const resetUrl = `${frontend}/password/reset/${resetToken}`
    const message = `Your password reset link is:\n\n${resetUrl}\n\nIt expires in 30 minutes. If you did not request this, ignore this email.`
    const safeResetUrl = resetUrl.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))

    try {
        await sendEmail({
            email: user.email,
            subject: 'Cartify Password Recovery',
            message,
            html: `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f0;font-family:Arial,Helvetica,sans-serif;color:#17332a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f5f0;padding:32px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e3e9e5"><tr><td style="padding:24px 32px;background:#17332a;border-bottom:4px solid #c9a227;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:2px">CARTIFY</td></tr><tr><td style="padding:32px"><p style="margin:0 0 12px;color:#c9a227;font-size:12px;font-weight:bold;letter-spacing:2px">ACCOUNT SECURITY</p><h1 style="margin:0 0 16px;color:#17332a;font-size:24px">Reset your password</h1><p style="margin:0 0 24px;color:#53645c;font-size:15px;line-height:1.6">We received a request to reset your Cartify password. Use the button below to choose a new one.</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="background:#17332a;border-radius:4px"><a href="${safeResetUrl}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px">RESET PASSWORD</a></td></tr></table><p style="margin:24px 0 8px;color:#53645c;font-size:13px;line-height:1.6">This link expires in 30 minutes. If you did not request a password reset, you can safely ignore this email.</p><p style="margin:20px 0 0;color:#829088;font-size:12px;line-height:1.5">If the button doesn’t work, copy this link into your browser:<br><a href="${safeResetUrl}" style="color:#2b5344;word-break:break-all">${safeResetUrl}</a></p></td></tr><tr><td style="padding:16px 32px;background:#f1f5f2;color:#718078;font-size:12px">Cartify · Makeup you’ll actually love wearing.</td></tr></table></td></tr></table></body></html>`
        })
        res.status(200).json(reply)
    } catch (err) {
        console.error('Password reset email delivery failed:', err.message)
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save({ validateBeforeSave: false })
        res.status(500).json({ success: false, message: 'Email could not be sent. Check your SMTP settings.' })
    }
}

// PUT /api/v1/password/reset/:token
exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body
        const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex')

        const user = await User.findOne({
            resetPasswordToken: hashed,
            resetPasswordExpire: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' })
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator to reactivate it.' })
        }
        if (!password || password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' })
        }

        user.password = password
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save()
        sendToken(user, 200, res)
    } catch (err) {
        res.status(400).json({ success: false, message: err.message })
    }
}

// ---------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------

// GET /api/v1/admin/users
exports.allUsers = async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).json({ success: true, users })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}

// GET /api/v1/admin/user/:id
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ success: false, message: `User not found with id: ${req.params.id}` })
        }
        res.status(200).json({ success: true, user })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}

// PUT /api/v1/admin/user/:id
exports.updateUser = async (req, res) => {
    try {
        const newUserData = typeof req.body.isActive === 'boolean'
            ? { isActive: req.body.isActive }
            : {
                name: req.body.name,
                email: req.body.email,
                role: req.body.role
            }

        const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
            new: true,
            runValidators: true
        })
        if (!user) {
            return res.status(404).json({ success: false, message: `User not found with id: ${req.params.id}` })
        }
        res.status(200).json({ success: true, user })
    } catch (err) {
        res.status(400).json({ success: false, message: err.message })
    }
}

// DELETE /api/v1/admin/user/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ success: false, message: `User not found with id: ${req.params.id}` })
        }

        // remove the avatar from cloudinary too, if there is one
        if (user.avatar?.public_id) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id)
        }

        await User.findByIdAndDelete(req.params.id)
        res.status(200).json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}
