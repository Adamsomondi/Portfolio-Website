import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  // Validate
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  try {
    // Email to YOU — the notification
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New message from ${name} — Portfolio`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d4ed8; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
            New Portfolio Contact
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 80px;">Name</td>
              <td style="padding: 8px 0; color: #111827;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${email}" style="color: #1d4ed8;">${email}</a>
              </td>
            </tr>
          </table>
          <div style="margin-top: 16px;">
            <p style="font-weight: bold; color: #374151; margin-bottom: 8px;">Message</p>
            <div style="background: #f9fafb; border-left: 4px solid #1d4ed8; padding: 16px; border-radius: 4px; color: #111827; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            Hit reply to respond directly to ${name}
          </p>
        </div>
      `
    });

    // Auto-reply to SENDER
    await transporter.sendMail({
      from: `"Adams Omondi" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Got your message — Adams Omondi`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827;">Hey ${name},</h2>
          <p style="color: #374151; line-height: 1.6;">
            Thanks for reaching out. I have received your message and will get back to you 
            within 24–48 hours.
          </p>
          <p style="color: #374151; line-height: 1.6;">
            Here is what you sent me:
          </p>
          <div style="background: #f9fafb; border-left: 4px solid #1d4ed8; padding: 16px; border-radius: 4px; color: #6b7280; line-height: 1.6; font-style: italic;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #374151; line-height: 1.6; margin-top: 20px;">
            Talk soon,<br/>
            <strong>Adams Omondi</strong><br/>
            <span style="color: #6b7280; font-size: 14px;">Software Engineer — Nairobi, Kenya</span>
          </p>
        </div>
      `
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Email error:', error.message);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
});

export default router;