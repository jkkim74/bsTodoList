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

// ✅ GET /google/authorize - 인증 URL 생성
app.get('/google/authorize', async (c) => {
  const platform = c.req.query('platform');
  console.log(`[Auth] Google authorize request - platform: ${platform || 'web'}`);

  // ✅ platform별 redirect_uri 결정
  const redirectUri = platform === 'app'
    ? 'com.braindump.app://oauth-callback'  // 앱용 딥링크
    : process.env.GOOGLE_REDIRECT_URI!;     // 웹용 URL

  console.log(`[Auth] Using redirect_uri: ${redirectUri}`);

  const state = crypto.randomUUID();

  // ✅ 수정된 함수에 redirectUri 전달
  const authUrl = getGoogleAuthUrl(state, redirectUri);

  // State 쿠키 저장 (웹용)
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 10, // 10분
    path: '/',
  });

  return c.json({
    success: true,
    data: {
      authUrl,
      state
    }
  });
});

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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script>
            // Try deep link first
            const deepLink = 'com.braindump.app://oauth/callback?error=' + encodeURIComponent('${error}')
            window.location.href = deepLink
            
            // Fallback to web
            setTimeout(() => {
              window.location.href = '/?error=' + encodeURIComponent('${error}')
            }, 500)
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Google 로그인 오류</h2>
          <p>앱으로 돌아가는 중...</p>
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script>
            // Try deep link first
            const deepLink = 'com.braindump.app://oauth/callback?error=' + encodeURIComponent('Authorization code missing')
            window.location.href = deepLink
            
            // Fallback to web
            setTimeout(() => {
              window.location.href = '/?error=' + encodeURIComponent('인증 코드가 없습니다.')
            }, 500)
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>인증 코드 오류</h2>
          <p>앱으로 돌아가는 중...</p>
        </body>
        </html>
      `)
    }

    // Success: Redirect back to app with code and state
    const isApp = state?.endsWith('_app')
    
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Login Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          // 🔥 Try Deep Link first (for hybrid app)
          // Deep Link will automatically trigger App URL Listener if app is available
          const deepLink = 'com.braindump.app://oauth/callback?code=${code}' + 
            (('${state}') ? '&state=${state}' : '')
          
          console.log('[OAuth Callback] Attempting deep link:', deepLink)
          
          // Try to open deep link (will work if app is installed)
          window.location.href = deepLink
          
          ${!isApp ? `
          // Fallback to web redirect after a short delay
          // If deep link works, this won't execute (page will have navigated away)
          setTimeout(() => {
            console.log('[OAuth Callback] Deep link timeout, falling back to web redirect')
            const webUrl = '/?code=${code}' + (('${state}') ? '&state=${state}' : '')
            window.location.href = webUrl
          }, 500)
          ` : `
          console.log('[OAuth Callback] App mode detected - skipping auto web fallback')
          `}
        </script>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>Google 로그인 성공!</h2>
        <p>앱으로 돌아가는 중...</p>
        ${isApp ? `
        <p>자동으로 이동하지 않으면 아래 버튼을 눌러주세요.</p>
        <button onclick="window.location.href=deepLink" style="padding: 10px 20px; background-color: #4F46E5; color: white; border: none; border-radius: 5px; margin-top: 20px; font-size: 16px;">앱으로 돌아가기</button>
        ` : `
        <p style="color: #666; font-size: 14px;">자동으로 돌아가지 않는다면 <a href="/?code=${code}${state ? '&state=' + state : ''}">여기를 클릭</a>하세요.</p>
        `}
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

// ✅ POST /google/callback - 토큰 교환
app.post('/google/callback', async (c) => {
  try {
    const body = await c.req.json();
    const { code, state, platform } = body;  // ✅ platform 추가 필수

    console.log(`[Auth] Google callback - platform: ${platform || 'web'}, code: ${code?.substring(0, 20)}...`);

    if (!code) {
      return c.json({ success: false, error: 'Authorization code required' }, 400);
    }

    // State 검증 (웹만, 앱은 쿠키 접근 제한으로 완화)
    if (platform !== 'app') {
      const storedState = getCookie(c, 'oauth_state');
      if (!storedState || state !== storedState) {
        console.error('[Auth] State mismatch:', { provided: state, stored: storedState });
        return c.json({ success: false, error: 'Invalid state' }, 400);
      }
    } else {
      console.log('[Auth] App mode - skipping cookie-based state verification');
    }

    // ✅ 인증 시와 동일한 redirect_uri 사용 (필수!)
    const redirectUri = platform === 'app'
      ? 'com.braindump.app://oauth-callback'
      : process.env.GOOGLE_REDIRECT_URI!;

    console.log(`[Auth] Token exchange with redirect_uri: ${redirectUri}`);

    // ✅ 수정된 함수에 redirectUri 전달
    const googleUser = await validateGoogleCallback(code, redirectUri);

    // 기존 사용자 처리 로직 (DB 조회/생성, JWT 발급 등)
    // const user = await findOrCreateUser(googleUser);
    // const token = generateJwt(user);

    // State 쿠키 정리
    if (platform !== 'app') {
      setCookie(c, 'oauth_state', '', { maxAge: 0, path: '/' });
    }

    console.log(`[Auth] Google login successful for: ${googleUser.email}`);

    return c.json({
      success: true,
      data: {
        user: googleUser,  // 실제로는 DB 사용자 정보
        token: "generated_jwt_token"  // 실제 JWT 토큰
      }
    });

  } catch (error) {
    console.error('[Auth] Google callback error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }, 500);
  }
});

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
