import jwt from 'jsonwebtoken'
import config from '../../config/env'

export interface TokenPayload {
  userId: number
  email: string
  role: string
}

/**
 * Create JWT access token
 */
export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '8h' // 8 hours
  })
}

/**
 * Create JWT refresh token
 */
export function createRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d' // 7 days
  })
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Check if token needs renewal (less than 2 hours remaining)
 */
export function shouldRenewToken(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return false
    
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = decoded.exp - now
    const twoHoursInSeconds = 2 * 60 * 60
    
    return timeUntilExpiry < twoHoursInSeconds
  } catch (error) {
    return false
  }
}

/**
 * Create both access and refresh tokens
 */
export function createTokenPair(payload: TokenPayload) {
  return {
    accessToken: createToken(payload),
    refreshToken: createRefreshToken(payload)
  }
}
