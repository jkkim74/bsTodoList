import type { Context, Next } from 'hono'
import { verifyJWT } from '../utils/jwt'
import { errorResponse } from '../utils/response'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(c, 'Unauthorized: No token provided', 401)
  }

  const token = authHeader.substring(7)
  const payload = await verifyJWT(token)

  if (!payload) {
    return errorResponse(c, 'Unauthorized: Invalid or expired token', 401)
  }

  // Store user info in context
  c.set('userId', payload.userId)
  c.set('userEmail', payload.email)

  await next()
}
