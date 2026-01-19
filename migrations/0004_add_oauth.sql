-- Add OAuth support to users table
ALTER TABLE users ADD COLUMN oauth_provider TEXT; -- 'google', 'github' 등
ALTER TABLE users ADD COLUMN oauth_id TEXT;       -- OAuth 제공자의 고유 ID
ALTER TABLE users ADD COLUMN oauth_email TEXT;    -- OAuth 제공자 이메일
ALTER TABLE users ADD COLUMN profile_picture TEXT; -- 프로필 사진 URL
ALTER TABLE users ADD COLUMN provider_connected_at DATETIME;

-- Create unique index for OAuth accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider, oauth_id);

-- Create index for OAuth email lookup
CREATE INDEX IF NOT EXISTS idx_users_oauth_email ON users(oauth_email);
