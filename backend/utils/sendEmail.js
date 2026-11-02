const nodemailer = require('nodemailer');

const sendEmail = async options => {
    const port = Number(process.env.SMTP_PORT || 587)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'live.smtp.mailtrap.io',
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.text || options.message,
        html: options.html || `<p>${options.message}</p>`,
        attachments: options.attachments || [],
    }

    await transporter.sendMail(message)
}

module.exports = sendEmail;
