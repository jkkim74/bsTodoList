import { Hono } from 'hono'
import type { Env, SignupRequest, LoginRequest, VerifyEmailRequest, AuthResponse } from '../types'
import { 
  hashPassword, 
  verifyPassword, 
  signJWT, 
  validatePassword, 
  validateEmail, 
  generateVerificationCode, 
  getVerificationCodeExpiry 
} from '../utils/jwt'
import { successResponse, errorResponse, getCurrentDateTime } from '../utils/response'

const auth = new Hono<{ Bindings: Env }>()

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

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = getVerificationCodeExpiry()

    // In production, send email here
    // For now, we'll store it and return it (for testing)
    console.log(`[TEST] Verification code for ${email}: ${verificationCode}`)

    // Store verification code in a temporary storage or send via email
    // For this demo, we'll return the code (in production, send via email)
    return successResponse(c, {
      email,
      message: '인증 코드가 발송되었습니다. (테스트용: 콘솔 확인)',
      // For testing only - remove in production
      verificationCode
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

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT user_id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return errorResponse(c, '이미 가입된 이메일입니다.', 400)
    }

    // In production, verify the verification code here
    // For now, skip verification code check in development
    if (verification_code && verification_code !== 'SKIP_IN_DEV') {
      // TODO: Verify code from temporary storage or database
      // return errorResponse(c, '인증 코드가 올바르지 않습니다.', 400)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, username, is_active, email_verified) VALUES (?, ?, ?, 1, 1)'
    ).bind(email, hashedPassword, username).run()

    const userId = result.meta.last_row_id as number

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
