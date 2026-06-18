require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('User:', process.env.EMAIL_USER || 'Not set');
  console.log('Pass:', process.env.EMAIL_PASS ? '********' : 'Not set');

  let transporter;
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    console.log('Using Ethereal for testing...');
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"ComicTradeHub Test" <${process.env.EMAIL_USER || 'test@ethereal.email'}>`,
      to: process.env.EMAIL_USER || 'recipient@example.com', // Send to self
      subject: "Test Email",
      text: "This is a test email to verify nodemailer configuration."
    });
    console.log("Message sent successfully: %s", info.messageId);
    if (!process.env.EMAIL_USER) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testEmail();