const sendToken = (user, statusCode, res) => {
    // Create Jwt token
    const token = user.getJwtToken()
    user.password = undefined // never send the hash

    const isProduction = String(process.env.NODE_ENV).toLowerCase() === 'production'

    // Options for cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        user
    })
}

module.exports = sendToken