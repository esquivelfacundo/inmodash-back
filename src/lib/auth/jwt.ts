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
    expiresIn: '1h' // 1 hour
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
 * Create both access and refresh tokens
 */
export function createTokenPair(payload: TokenPayload) {
  return {
    accessToken: createToken(payload),
    refreshToken: createRefreshToken(payload)
  }
}
