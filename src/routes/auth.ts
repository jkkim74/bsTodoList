import { Hono } from 'hono'
import type { Env, SignupRequest, LoginRequest, AuthResponse } from '../types'
import { hashPassword, verifyPassword, signJWT } from '../utils/jwt'
import { successResponse, errorResponse, getCurrentDateTime } from '../utils/response'

const auth = new Hono<{ Bindings: Env }>()

// Signup
auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json<SignupRequest>()
    const { email, password, username } = body

    if (!email || !password || !username) {
      return errorResponse(c, 'Email, password, and username are required', 400)
    }

    // Check if email already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT user_id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return errorResponse(c, 'Email already registered', 400)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, username, is_active) VALUES (?, ?, ?, 1)'
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
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginRequest>()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse(c, 'Email and password are required', 400)
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT user_id, email, password, username, is_active FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return errorResponse(c, '이메일 또는 비밀번호가 올바르지 않습니다.', 401)
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
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default auth
