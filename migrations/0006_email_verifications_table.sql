-- Create email_verifications table for storing temporary verification codes
CREATE TABLE IF NOT EXISTS email_verifications (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index to ensure one pending verification per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verifications_email 
ON email_verifications(email) WHERE verified = 0;

-- Create index for code lookup
CREATE INDEX IF NOT EXISTS idx_email_verifications_code 
ON email_verifications(code);

-- Create index for cleanup of expired verifications
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires 
ON email_verifications(expires_at);
