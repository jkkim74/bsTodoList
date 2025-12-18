import type { JWTPayload } from '../types'

const SECRET = 'your-secret-key-change-in-production' // In production, use environment variable

export async function signJWT(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 7 * 24 * 60 * 60 // 7 days
  
  const jwtPayload: JWTPayload = {
    ...payload,
    exp
  }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(jwtPayload))
  const message = `${encodedHeader}.${encodedPayload}`

  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, data)
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))

  return `${message}.${encodedSignature}`
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const message = `${encodedHeader}.${encodedPayload}`

    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureBuffer = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, signatureBuffer, data)

    if (!valid) return null

    const payload: JWTPayload = JSON.parse(atob(encodedPayload))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp < now) return null

    return payload
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - in production use bcrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}
