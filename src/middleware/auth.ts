import { Request, Response, NextFunction } from 'express'
import { verifyToken, shouldRenewToken, createToken } from '../lib/auth/jwt'
import { logger } from '../utils/logger'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number
        email: string
        role: string
      }
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.['auth-token']

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      })
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })
    }

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    }

    // Check if token needs renewal and renew if necessary
    if (shouldRenewToken(token)) {
      try {
        const newToken = createToken({
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        })
        
        // Set new token in cookie
        res.cookie('auth-token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 8 * 60 * 60 * 1000 // 8 hours
        })
        
        // Also send in response header for frontend to update
        res.setHeader('X-New-Token', newToken)
        
        logger.info(`Token renewed for user ${payload.email}`)
      } catch (renewError) {
        logger.error('Token renewal failed', renewError)
        // Continue with existing token
      }
    }

    next()
  } catch (error) {
    logger.error('Authentication error', error)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    })
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if missing
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.['auth-token']

    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        }
      }
    }

    next()
  } catch (error) {
    // Continue without user
    next()
  }
}

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}
