-- Fix email_verified for existing OAuth users
-- Google OAuth users should have email_verified = 1 since Google verifies emails
UPDATE users 
SET email_verified = 1 
WHERE oauth_provider = 'google' 
  AND oauth_id IS NOT NULL 
  AND email_verified = 0;

-- For safety, also ensure all OAuth users have email_verified = 1
UPDATE users 
SET email_verified = 1 
WHERE oauth_provider IS NOT NULL 
  AND oauth_id IS NOT NULL 
  AND email_verified = 0;
