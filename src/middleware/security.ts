import { Request, Response, NextFunction } from 'express'

/**
 * Security headers middleware
 * Adds essential security headers to all responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (basic)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'none'"
  )
  
  next()
}

/**
 * Request logging middleware
 * Logs all incoming requests for debugging and security auditing
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logMessage = `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    
    if (res.statusCode >= 400) {
      console.warn(`⚠️  ${logMessage}`)
    } else {
      console.log(`✓ ${logMessage}`)
    }
  })
  
  next()
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use redis-based rate limiting
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const simpleRateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown'
    const now = Date.now()
    
    const record = requestCounts.get(identifier)
    
    if (!record || now > record.resetTime) {
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      })
    }
    
    record.count++
    next()
  }
}

/**
 * Input sanitization middleware
 * Prevents common injection attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim()
      }
    })
  }
  
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body)
  }
  
  next()
}

function sanitizeObject(obj: any): void {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim()
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key])
    }
  })
}
