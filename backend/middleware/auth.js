const User = require('../models/user')
const jwt = require("jsonwebtoken")

exports.isAuthenticatedUser = async (req, res, next) => {

    // const token = req.header('Authorization').split(' ')[1];
    // console.log(token)
    const { token } = req.cookies

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    // a bad or expired token makes jwt.verify throw; answer 401 instead of crashing the server
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }

    if (!req.user) {
        return res.status(401).json({ message: 'Account not found. Please sign in again.' })
    }
    if (!req.user.isActive) {
        const isProduction = String(process.env.NODE_ENV).toLowerCase() === 'production'
        res.cookie('token', null, {
            expires: new Date(0),
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
        })
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator to reactivate it.' })
    }

    next()
};

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {
        // console.log(roles, req.user, req.body);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to acccess this resource` })

        }
        next()
    }
}
