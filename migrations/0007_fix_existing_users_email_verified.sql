-- Fix email_verified for existing users
-- Background: Existing users created before email verification system
-- were created with email_verified = 0 by default

-- Update specific test user
UPDATE users 
SET email_verified = 1 
WHERE email = 'jack68@naver.com';

-- Update all existing non-OAuth users to verified
-- (They were created before the email verification system)
UPDATE users 
SET email_verified = 1 
WHERE email_verified = 0 
  AND oauth_provider IS NULL
  AND created_at < '2026-01-19';  -- Before email verification system was implemented

-- Note: New users after 2026-01-19 must complete email verification
