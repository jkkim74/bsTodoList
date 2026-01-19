import type { GoogleTokenResponse, GoogleUserInfo } from '../types'

// Google OAuth endpoints
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'
const GOOGLE_OAUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

export class GoogleOAuthError extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

/**
 * Generate Google OAuth authorization URL
 */
export function generateGoogleOAuthUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    ...(state && { state })
  })

  return `${GOOGLE_OAUTH_ENDPOINT}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  })

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new GoogleOAuthError('TOKEN_EXCHANGE_FAILED', error.error_description || 'Failed to exchange code for token')
  }

  return response.json()
}

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new GoogleOAuthError('USERINFO_FETCH_FAILED', 'Failed to fetch user info from Google')
  }

  return response.json()
}

/**
 * Verify and decode ID token (for ID Token Flow)
 * Note: In production, verify signature with Google's public keys
 */
export function decodeIdToken(idToken: string): GoogleUserInfo {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch (error) {
    throw new GoogleOAuthError('IDTOKEN_DECODE_FAILED', 'Failed to decode ID token')
  }
}

/**
 * Verify ID token with Google (for production)
 */
export async function verifyIdToken(idToken: string, clientId: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `id_token=${idToken}`
  })

  if (!response.ok) {
    throw new GoogleOAuthError('IDTOKEN_VERIFICATION_FAILED', 'Failed to verify ID token')
  }

  const data = await response.json()

  // Verify audience
  if (data.aud !== clientId) {
    throw new GoogleOAuthError('IDTOKEN_AUD_MISMATCH', 'Token audience does not match')
  }

  return data
}

/**
 * Generate random state for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Store state in session/cache for verification
 */
export function stateCache() {
  const cache = new Map<string, { createdAt: number; used: boolean }>()

  return {
    set: (state: string) => {
      cache.set(state, { createdAt: Date.now(), used: false })
    },
    verify: (state: string) => {
      const entry = cache.get(state)
      if (!entry) return false
      if (entry.used) return false
      if (Date.now() - entry.createdAt > 10 * 60 * 1000) return false // 10 min expiry
      entry.used = true
      return true
    }
  }
}
