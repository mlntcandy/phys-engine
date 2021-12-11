import nodemailer from 'nodemailer'

export default async function SendMail(cfg = {host, port, isSecure, login, pass, sender, recipient, subject}, html) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port || 465,
        secure: cfg.isSecure || true, // true for 465, false for other ports
        auth: {
            user: cfg.login,
            pass: cfg.pass
        },
    });

    // send mail with defined transport object
    return await transporter.sendMail({
        from: `"${cfg.sender}" <${cfg.login}>`, // sender address
        to: cfg.recipient, // list of receivers
        subject: cfg.subject, // Subject line
        text: html, // plain text body
        html: html, // html body
    });

}