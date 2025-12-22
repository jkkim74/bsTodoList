#!/bin/bash

echo "=== Checking users table ==="
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM users"

echo ""
echo "=== Checking if test user exists ==="
npx wrangler d1 execute webapp-production --local --command="SELECT user_id, email, username FROM users WHERE email='test@example.com'"

echo ""
echo "=== Counting users ==="
npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) as count FROM users"
