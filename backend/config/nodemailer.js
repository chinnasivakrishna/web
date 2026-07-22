const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Dev test account via ethereal / log simulation
      console.log(`[Email Transporter] Simulating email send to: ${options.email}`);
      console.log(`[Email Subject]: ${options.subject}`);
      console.log(`[Email Message]:\n${options.message || options.html}`);
      return { messageId: 'simulated-email-id-12345' };
    }

    const message = {
      from: `"${process.env.FROM_NAME || 'StuVaradhi Platform'}" <${process.env.FROM_EMAIL || 'support@stuvaradhi.in'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    };

    const info = await transporter.sendMail(message);
    console.log(`[Email Sent]: %s`, info.messageId);
    return info;
  } catch (error) {
    console.error(`[Email Error]: ${error.message}`);
    // Log message gracefully without crashing request
    return null;
  }
};

module.exports = sendEmail;
