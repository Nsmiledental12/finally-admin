import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (email, resetToken, userType) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Password Reset Request</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello,
                  </p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    We received a request to reset your password for your ${userType === 'super_admin' ? 'Super Admin' : 'Admin'} account. Click the button below to reset your password:
                  </p>

                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="color: #667eea; font-size: 14px; line-height: 1.6; margin: 10px 0 20px 0; word-break: break-all;">
                    ${resetLink}
                  </p>

                  <!-- Warning Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 30px 0;">
                    <tr>
                      <td style="padding: 15px;">
                        <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                          <strong>Important:</strong> This link will expire in 1 hour for security reasons. If you did not request a password reset, please ignore this email or contact support if you have concerns.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Best regards,<br>
                    <strong>Medical Admin Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 12px; line-height: 1.6; margin: 0;">
                    This is an automated email. Please do not reply to this message.
                  </p>
                  <p style="color: #6c757d; font-size: 12px; line-height: 1.6; margin: 10px 0 0 0;">
                    © 2025 Smile Dental. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Request

Hello,

We received a request to reset your password for your ${userType === 'super_admin' ? 'Super Admin' : 'Admin'} account.

To reset your password, please visit the following link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
Medical Admin Team

---
This is an automated email. Please do not reply to this message.
© 2025 Smile Dental. All rights reserved.
  `;

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP credentials not configured. Email would be sent to:', email);
      console.log('Reset link:', resetLink);
      return {
        success: true,
        message: 'Email service not configured. Check server logs for reset link.',
        resetLink
      };
    }

    const info = await transporter.sendMail({
      from: `"Medical Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request - Medical Admin',
      text: textContent,
      html: htmlContent,
    });

    console.log('Password reset email sent:', info.messageId);
    return {
      success: true,
      message: 'Password reset email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export default {
  sendPasswordResetEmail
};
