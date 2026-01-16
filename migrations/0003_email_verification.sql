-- Add email verification fields to users table
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_code TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires_at DATETIME;

-- Create index for verification code lookup
CREATE INDEX IF NOT EXISTS idx_users_email_verification_code ON users(email_verification_code);
