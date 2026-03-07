import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ loaded' : '❌ missing');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

try {
  const info = await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: 'Test — Portfolio Email Works',
    text: 'If you see this, Nodemailer is working correctly.'
  });
  console.log('✅ Email sent:', info.messageId);
} catch (err) {
  console.error('❌ Failed:', err.message);
}