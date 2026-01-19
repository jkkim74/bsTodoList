import { Hono } from 'hono'
import type { Env, SignupRequest, LoginRequest, VerifyEmailRequest, AuthResponse, GoogleOAuthCallbackRequest } from '../types'
import { 
  hashPassword, 
  verifyPassword, 
  signJWT, 
  validatePassword, 
  validateEmail, 
  generateVerificationCode, 
  getVerificationCodeExpiry 
} from '../utils/jwt'
import {
  generateGoogleOAuthUrl,
  exchangeCodeForToken,
  getGoogleUserInfo,
  generateState,
  GoogleOAuthError
} from '../utils/google-oauth'
import { successResponse, errorResponse, getCurrentDateTime } from '../utils/response'
import { sendVerificationEmail } from '../utils/email'

const auth = new Hono<{ Bindings: Env }>()

// 🆕 Google OAuth: Get authorization URL
auth.get('/google/authorize', async (c) => {
  try {
    const clientId = c.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      return errorResponse(c, 'Google Client ID not configured', 500)
    }

    // Generate state for CSRF protection
    const state = generateState()
    
    // In production, store state in session/Redis with expiry
    // For now, we'll send it to client to be passed back
    
    const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`
    const authUrl = generateGoogleOAuthUrl(clientId, redirectUri, state)

    return successResponse(c, {
      authUrl,
      state
    }, 'Google authorization URL generated')
  } catch (error) {
    console.error('Google authorize error:', error)
    return errorResponse(c, '구글 로그인 준비 중 오류가 발생했습니다.', 500)
  }
})

// 🆕 Google OAuth: Handle callback (GET - from Google redirect)
auth.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')

    // Check for OAuth errors
    if (error) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Login Error</title>
          <script>
            // 🔥 Hybrid App: Use custom URL scheme
            const isHybridApp = window.Capacitor && window.Capacitor.isNativePlatform()
            if (isHybridApp) {
              window.location.href = 'com.braindump.app://oauth/callback?error=' + encodeURIComponent('${error}')
            } else {
              // Web: Standard redirect
              window.location.href = '/?error=' + encodeURIComponent('${error}')
            }
          </script>
        </head>
        <body>
          <p>Google 로그인 오류가 발생했습니다. 잠시 후 리디렉션됩니다...</p>
        </body>
        </html>
      `)
    }

    if (!code) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Login Error</title>
          <script>
            // 🔥 Hybrid App: Use custom URL scheme
            const isHybridApp = window.Capacitor && window.Capacitor.isNativePlatform()
            if (isHybridApp) {
              window.location.href = 'com.braindump.app://oauth/callback?error=' + encodeURIComponent('Authorization code missing')
            } else {
              // Web: Standard redirect
              window.location.href = '/?error=' + encodeURIComponent('인증 코드가 없습니다.')
            }
          </script>
        </head>
        <body>
          <p>인증 코드가 없습니다. 잠시 후 리디렉션됩니다...</p>
        </body>
        </html>
      `)
    }

    // Success: Redirect back to app with code and state
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Login Success</title>
        <script>
          // 🔥 Hybrid App: Use custom URL scheme for deep linking
          const isHybridApp = window.Capacitor && window.Capacitor.isNativePlatform()
          if (isHybridApp) {
            const deepLink = 'com.braindump.app://oauth/callback?code=${code}' + 
              (('${state}') ? '&state=${state}' : '')
            console.log('[Hybrid App] Deep linking to:', deepLink)
            window.location.href = deepLink
          } else {
            // Web: Standard redirect with query params
            const webUrl = '/?code=${code}' + (('${state}') ? '&state=${state}' : '')
            console.log('[Web] Redirecting to:', webUrl)
            window.location.href = webUrl
          }
        </script>
      </head>
      <body>
        <p>Google 로그인 성공! 잠시 후 앱으로 돌아갑니다...</p>
      </body>
      </html>
    `)>
        <html>
        <head>
          <title>Google Login Error</title>
          <script>
            window.location.href = '/?error=' + encodeURIComponent('인증 코드가 없습니다.')
          </script>
        </head>
        <body>
          <p>리디렉션 중...</p>
        </body>
        </html>
      `)
    }

    // Return HTML that will trigger the callback handler in app.js
    return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>Google 로그인 처리 중...</title>
        <script>
          // Pass the code and state back to the main page
          window.location.href = '/?code=${encodeURIComponent(code)}${state ? '&state=' + encodeURIComponent(state) : ''}'
        </script>
      </head>
      <body>
        <p style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          Google 로그인 처리 중... 잠시만 기다려주세요.
        </p>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Google callback GET error:', error)
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Login Error</title>
        <script>
          window.location.href = '/?error=' + encodeURIComponent('Google 로그인 중 오류가 발생했습니다.')
        </script>
      </head>
      <body>
        <p>오류가 발생했습니다. 리디렉션 중...</p>
      </body>
      </html>
    `)
  }
})

// 🆕 Google OAuth: Handle callback (POST - from frontend)
auth.post('/google/callback', async (c) => {
  try {
    const body = await c.req.json<GoogleOAuthCallbackRequest & { state?: string }>()
    const { code, state } = body

    if (!code) {
      return errorResponse(c, 'Authorization code is required', 400)
    }

    const clientId = c.env.VITE_GOOGLE_CLIENT_ID
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return errorResponse(c, 'Google OAuth not configured', 500)
    }

    // Verify state (in production, check against stored state)
    // For now, skip state verification in development

    const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    )

    // Get user info
    const userInfo = await getGoogleUserInfo(tokenResponse.access_token)

    if (!userInfo.email || !userInfo.sub) {
      return errorResponse(c, 'Failed to get user info from Google', 400)
    }

    // Check if user exists by OAuth ID
    let user = await c.env.DB.prepare(
      'SELECT user_id, email, username, profile_picture FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).bind('google', userInfo.sub).first()

    if (user) {
      // Existing OAuth user - update last login
      await c.env.DB.prepare(
        'UPDATE users SET last_login_at = ?, profile_picture = ? WHERE user_id = ?'
      ).bind(getCurrentDateTime(), userInfo.picture, user.user_id).run()
    } else {
      // Check if user exists by email (link OAuth to existing account)
      const existingUser = await c.env.DB.prepare(
        'SELECT user_id, email, username FROM users WHERE email = ?'
      ).bind(userInfo.email).first()

      if (existingUser) {
        // Link OAuth to existing account
        await c.env.DB.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, oauth_email = ?, profile_picture = ?, provider_connected_at = ?, email_verified = 1 WHERE user_id = ?'
        ).bind('google', userInfo.sub, userInfo.email, userInfo.picture, getCurrentDateTime(), existingUser.user_id).run()
        user = existingUser
      } else {
        // Create new user from Google OAuth
        const username = userInfo.name || userInfo.email.split('@')[0]
        const result = await c.env.DB.prepare(
          `INSERT INTO users (
            email, password, username, is_active, email_verified,
            oauth_provider, oauth_id, oauth_email, profile_picture, provider_connected_at
          ) VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          '', // No password for OAuth users
          username,
          'google',
          userInfo.sub,
          userInfo.email,
          userInfo.picture,
          getCurrentDateTime()
        ).run()

        user = {
          user_id: result.meta.last_row_id,
          email: userInfo.email,
          username,
          profile_picture: userInfo.picture
        }
      }
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = ? WHERE user_id = ?'
    ).bind(getCurrentDateTime(), user.user_id).run()

    // Generate JWT
    const token = await signJWT({
      userId: user.user_id as number,
      email: user.email as string
    })

    const response: AuthResponse = {
      user_id: user.user_id as number,
      email: user.email as string,
      username: user.username as string,
      token
    }

    return successResponse(c, response, 'Google 로그인 성공', 200)
  } catch (error) {
    console.error('Google callback error:', error)
    if (error instanceof GoogleOAuthError) {
      return errorResponse(c, error.message, 400)
    }
    return errorResponse(c, '구글 로그인 중 오류가 발생했습니다.', 500)
  }
})

// 🆕 Google OAuth: Direct ID Token verification (alternative method)
auth.post('/google/token', async (c) => {
  try {
    const body = await c.req.json<{ idToken: string }>()
    const { idToken } = body

    if (!idToken) {
      return errorResponse(c, 'ID Token is required', 400)
    }

    const clientId = c.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      return errorResponse(c, 'Google Client ID not configured', 500)
    }

    // In production, verify ID token signature with Google's public keys
    // For now, we'll decode and use it (less secure, but works for development)
    
    // Decode token without verification (for development only)
    // In production, use: verifyIdToken(idToken, clientId)
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      return errorResponse(c, 'Invalid token format', 400)
    }

    const userInfo = JSON.parse(atob(parts[1]))

    if (!userInfo.email || !userInfo.sub) {
      return errorResponse(c, 'Invalid user info in token', 400)
    }

    // Check if user exists by OAuth ID
    let user = await c.env.DB.prepare(
      'SELECT user_id, email, username, profile_picture FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).bind('google', userInfo.sub).first()

    if (user) {
      // Existing OAuth user - update last login
      await c.env.DB.prepare(
        'UPDATE users SET last_login_at = ?, profile_picture = ? WHERE user_id = ?'
      ).bind(getCurrentDateTime(), userInfo.picture, user.user_id).run()
    } else {
      // Check if user exists by email
      const existingUser = await c.env.DB.prepare(
        'SELECT user_id, email, username FROM users WHERE email = ?'
      ).bind(userInfo.email).first()

      if (existingUser) {
        // Link OAuth to existing account
        await c.env.DB.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, oauth_email = ?, profile_picture = ?, provider_connected_at = ?, email_verified = 1 WHERE user_id = ?'
        ).bind('google', userInfo.sub, userInfo.email, userInfo.picture, getCurrentDateTime(), existingUser.user_id).run()
        user = existingUser
      } else {
        // Create new user
        const username = userInfo.name || userInfo.email.split('@')[0]
        const result = await c.env.DB.prepare(
          `INSERT INTO users (
            email, password, username, is_active, email_verified,
            oauth_provider, oauth_id, oauth_email, profile_picture, provider_connected_at
          ) VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?)`
        ).bind(
          userInfo.email,
          '',
          username,
          'google',
          userInfo.sub,
          userInfo.email,
          userInfo.picture,
          getCurrentDateTime()
        ).run()

        user = {
          user_id: result.meta.last_row_id,
          email: userInfo.email,
          username,
          profile_picture: userInfo.picture
        }
      }
    }

    // Generate JWT
    const token = await signJWT({
      userId: user.user_id as number,
      email: user.email as string
    })

    const response: AuthResponse = {
      user_id: user.user_id as number,
      email: user.email as string,
      username: user.username as string,
      token
    }

    return successResponse(c, response, 'Google 로그인 성공')
  } catch (error) {
    console.error('Google token error:', error)
    return errorResponse(c, '구글 인증 중 오류가 발생했습니다.', 500)
  }
})

// Existing signup endpoints...
// 🆕 Signup - Step 1: Request verification code
auth.post('/signup/request-verification', async (c) => {
  try {
    const body = await c.req.json<{ email: string }>()
    const { email } = body

    if (!email) {
      return errorResponse(c, '이메일은 필수입니다.', 400)
    }

    // Email format validation
    if (!validateEmail(email)) {
      return errorResponse(c, '올바른 이메일 형식이 아닙니다.', 400)
    }

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT user_id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return errorResponse(c, '이미 가입된 이메일입니다.', 400)
    }

    // ✅ Rate limiting check: prevent too many requests
    const recentVerification = await c.env.DB.prepare(
      'SELECT created_at FROM email_verifications WHERE email = ? AND created_at > datetime("now", "-1 minute")'
    ).bind(email).first()

    if (recentVerification) {
      return errorResponse(c, '인증 코드는 1분에 한 번만 요청할 수 있습니다.', 429)
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = getVerificationCodeExpiry()

    // ✅ Store verification code in database
    await c.env.DB.prepare(`
      INSERT INTO email_verifications (email, code, expires_at, verified, attempt_count)
      VALUES (?, ?, ?, 0, 0)
      ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        verified = 0,
        attempt_count = 0,
        created_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).bind(email, verificationCode, expiresAt).run()

    // ✅ Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode, c.env)

    if (!emailSent && c.env.EMAIL_SERVICE_ENABLED) {
      return errorResponse(c, '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.', 500)
    }

    // ✅ Return success without exposing the code (security)
    return successResponse(c, {
      email,
      message: emailSent 
        ? '인증 코드가 이메일로 발송되었습니다.' 
        : '인증 코드가 발송되었습니다. (개발 모드: 콘솔 확인)',
      // Only include code in development mode
      ...((!c.env.EMAIL_SERVICE_ENABLED) && { verificationCode })
    }, '인증 코드가 발송되었습니다.')
  } catch (error) {
    console.error('Request verification error:', error)
    return errorResponse(c, '요청 처리 중 오류가 발생했습니다.', 500)
  }
})

// 🆕 Signup - Step 2: Verify email code and complete signup
auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json<SignupRequest & { verification_code: string }>()
    const { email, password, password_confirm, username, verification_code } = body

    // Validation
    if (!email || !password || !password_confirm || !username) {
      return errorResponse(c, '이메일, 비밀번호, 비밀번호 확인, 이름은 필수입니다.', 400)
    }

    if (!verification_code) {
      return errorResponse(c, '인증 코드는 필수입니다.', 400)
    }

    // Email format validation
    if (!validateEmail(email)) {
      return errorResponse(c, '올바른 이메일 형식이 아닙니다.', 400)
    }

    // Check if passwords match
    if (password !== password_confirm) {
      return errorResponse(c, '비밀번호가 일치하지 않습니다.', 400)
    }

    // Password strength validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return errorResponse(c, passwordValidation.errors.join(' '), 400)
    }

    // ✅ Verify the verification code
    const verification = await c.env.DB.prepare(
      'SELECT * FROM email_verifications WHERE email = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1'
    ).bind(email).first()

    if (!verification) {
      return errorResponse(c, '인증 코드를 먼저 요청해주세요.', 400)
    }

    // ✅ Check if code matches
    if (verification.code !== verification_code) {
      // Increment attempt count
      const attemptCount = (verification.attempt_count as number) + 1
      
      await c.env.DB.prepare(
        'UPDATE email_verifications SET attempt_count = ?, updated_at = CURRENT_TIMESTAMP WHERE verification_id = ?'
      ).bind(attemptCount, verification.verification_id).run()

      // ✅ Block after 5 failed attempts
      if (attemptCount >= 5) {
        await c.env.DB.prepare(
          'UPDATE email_verifications SET verified = -1 WHERE verification_id = ?'
        ).bind(verification.verification_id).run()
        
        return errorResponse(c, '인증 시도 횟수를 초과했습니다. 인증 코드를 다시 요청해주세요.', 429)
      }

      return errorResponse(c, `인증 코드가 올바르지 않습니다. (${5 - attemptCount}회 남음)`, 400)
    }

    // ✅ Check if code has expired
    const now = new Date()
    const expiresAt = new Date(verification.expires_at as string)
    
    if (now > expiresAt) {
      return errorResponse(c, '인증 코드가 만료되었습니다. 인증 코드를 다시 요청해주세요.', 400)
    }

    // ✅ Check if already verified (prevent reuse)
    if (verification.verified === 1) {
      return errorResponse(c, '이미 사용된 인증 코드입니다.', 400)
    }

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT user_id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return errorResponse(c, '이미 가입된 이메일입니다.', 400)
    }

    // ✅ Mark verification as used
    await c.env.DB.prepare(
      'UPDATE email_verifications SET verified = 1, updated_at = CURRENT_TIMESTAMP WHERE verification_id = ?'
    ).bind(verification.verification_id).run()

    // Hash password
    const hashedPassword = await hashPassword(password)

    // ✅ Insert new user (email_verified = 1 since we verified the code)
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, username, is_active, email_verified) VALUES (?, ?, ?, 1, 1)'
    ).bind(email, hashedPassword, username).run()

    const userId = result.meta.last_row_id as number

    // ✅ Clean up old verifications for this email
    await c.env.DB.prepare(
      'DELETE FROM email_verifications WHERE email = ? AND verification_id != ?'
    ).bind(email, verification.verification_id).run()

    // Generate JWT
    const token = await signJWT({ userId, email })

    const response: AuthResponse = {
      user_id: userId,
      email,
      username,
      token
    }

    return successResponse(c, response, '회원가입이 완료되었습니다.', 201)
  } catch (error) {
    console.error('Signup error:', error)
    return errorResponse(c, '회원가입 중 오류가 발생했습니다.', 500)
  }
})

// Login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginRequest>()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse(c, '이메일과 비밀번호는 필수입니다.', 400)
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT user_id, email, password, username, is_active, email_verified FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return errorResponse(c, '이메일 또는 비밀번호가 올바르지 않습니다.', 401)
    }

    // Check if email is verified
    if (!user.email_verified) {
      return errorResponse(c, '이메일 인증이 필요합니다. 이메일을 확인해주세요.', 403)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password as string)
    if (!isValid) {
      return errorResponse(c, '이메일 또는 비밀번호가 올바르지 않습니다.', 401)
    }

    if (!user.is_active) {
      return errorResponse(c, '비활성화된 계정입니다.', 403)
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = ? WHERE user_id = ?'
    ).bind(getCurrentDateTime(), user.user_id).run()

    // Generate JWT
    const token = await signJWT({ 
      userId: user.user_id as number, 
      email: user.email as string 
    })

    const response: AuthResponse = {
      user_id: user.user_id as number,
      email: user.email as string,
      username: user.username as string,
      token
    }

    return successResponse(c, response, '로그인 성공')
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse(c, '로그인 중 오류가 발생했습니다.', 500)
  }
})

export default auth
