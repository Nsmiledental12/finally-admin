# Forgot Password Feature - Setup Guide

This document explains the forgot password functionality that has been added to your Medical Admin Dashboard.

## Features Added

1. **Forgot Password Page** - Users can request a password reset link by entering their email
2. **Reset Password Page** - Users can set a new password using the reset link sent to their email
3. **Email Service** - Automated password reset emails with secure tokens
4. **Token Management** - Secure, time-limited reset tokens (1-hour expiration)
5. **Database Support** - New table for managing password reset tokens

## Database Setup

### Step 1: Run the Migration

You need to create the `admin_password_reset_tokens` table in your PostgreSQL database. Run the SQL migration file:

```bash
psql -h database-1.cnwu8u0y2mg3.ap-south-1.rds.amazonaws.com -U postgres -d dental_app -f backend/migrations/create_admin_password_reset_tokens.sql
```

Or connect to your database and execute the SQL from:
- `backend/migrations/create_admin_password_reset_tokens.sql`

**Note:** If you already have the old `password_reset_tokens` table, you can rename it by running:
- `backend/migrations/rename_to_admin_password_reset_tokens.sql`

### Step 2: Install Backend Dependencies

Install the new `nodemailer` package:

```bash
cd backend
npm install
```

## Email Configuration

### Option 1: Gmail (Recommended for Testing)

1. Create a Google account or use an existing one
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password

4. Update `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FRONTEND_URL=http://localhost:5174
```

### Option 2: Other Email Providers

For other email providers (SendGrid, AWS SES, Mailgun, etc.), update the SMTP settings in `backend/.env`:

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
FRONTEND_URL=http://localhost:5174
```

### Option 3: Development Mode (No Email)

If you don't configure SMTP credentials, the system will:
- Still generate reset tokens
- Log the reset link to the console
- Return success to the user

This is useful for development/testing without email setup.

## How It Works

### User Flow

1. **Request Password Reset**
   - User clicks "Forgot Password?" on login page
   - Enters their email address
   - Receives email with reset link (expires in 1 hour)

2. **Reset Password**
   - User clicks link in email
   - Gets redirected to reset password page
   - Enters new password (minimum 6 characters)
   - Password is updated and user is redirected to login

### Security Features

- **Token Hashing**: Reset tokens are hashed before storage (SHA-256)
- **One-Time Use**: Each token can only be used once
- **Time Expiration**: Tokens expire after 1 hour
- **Account Lockout Reset**: Resetting password clears failed login attempts
- **No Email Enumeration**: System doesn't reveal if email exists
- **Token Cleanup**: Used tokens are marked as used, old tokens are invalidated

### API Endpoints

Three new endpoints have been added to `/api/auth`:

1. **POST /api/auth/forgot-password**
   - Request body: `{ "email": "user@example.com" }`
   - Generates reset token and sends email

2. **POST /api/auth/verify-reset-token**
   - Request body: `{ "token": "reset-token-string" }`
   - Verifies token is valid and not expired

3. **POST /api/auth/reset-password**
   - Request body: `{ "token": "reset-token-string", "newPassword": "newpass123" }`
   - Resets the password and marks token as used

## Testing

### Without Email Configuration

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Go to login page
4. Click "Forgot Password?"
5. Enter an email address
6. Check backend console logs for the reset link
7. Copy the token from the URL and manually navigate to: `http://localhost:5174/?token=YOUR_TOKEN`

### With Email Configuration

1. Configure SMTP settings in `backend/.env`
2. Start both backend and frontend
3. Request password reset with a real email
4. Check your email inbox
5. Click the reset link
6. Enter new password

## Production Deployment

### Environment Variables

Update these variables for production in `backend/.env`:

```env
# Use your production database
DB_HOST=your-production-db-host
DB_NAME=your-production-db-name
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password

# Use your production frontend URL
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Use production email service
SMTP_HOST=smtp.yourprovider.com
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password

# Generate a strong JWT secret
JWT_SECRET=your-very-long-random-secret-key
```

### Security Checklist

- [ ] Database migration executed
- [ ] SMTP credentials configured
- [ ] FRONTEND_URL set to production domain
- [ ] JWT_SECRET is a strong random string
- [ ] SSL enabled for database connection
- [ ] Email templates reviewed and tested
- [ ] Rate limiting considered for forgot-password endpoint

## File Structure

New files added:
```
backend/
  migrations/
    create_admin_password_reset_tokens.sql    # Database migration (new installs)
    rename_to_admin_password_reset_tokens.sql # Migration to rename existing table
  utils/
    emailService.js                           # Email sending utility
  routes/
    auth.js                                   # Updated with 3 new endpoints

src/
  components/
    ForgotPasswordPage.tsx               # Forgot password form
    ResetPasswordPage.tsx                # Reset password form
    LoginPage.tsx                        # Updated with forgot password link
  App.tsx                                # Updated with routing logic
```

## Troubleshooting

### Email Not Sending

1. Check SMTP credentials in `.env`
2. Verify firewall allows outbound SMTP traffic (port 587)
3. For Gmail, ensure App Password is used, not regular password
4. Check backend console logs for error messages

### Token Invalid or Expired

1. Tokens expire after 1 hour
2. Each token can only be used once
3. Check system time is correct
4. Verify database migration was successful

### Reset Link Not Working

1. Verify FRONTEND_URL in backend `.env` matches your frontend URL
2. Check that URL parameter `?token=` is present
3. Ensure no proxy/firewall blocking the request

## Support

For issues or questions about the forgot password feature, check:
- Backend logs: `backend/server.js` console output
- Frontend console: Browser developer tools
- Database logs: Check PostgreSQL logs for errors

## Next Steps

Consider these enhancements:
- Add rate limiting to prevent abuse
- Implement email templates with your branding
- Add password strength requirements
- Track password reset history for audit logs
- Add SMS-based password reset option
