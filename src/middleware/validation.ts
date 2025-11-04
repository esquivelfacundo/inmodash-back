import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

/**
 * Validation middleware factory
 * Validates request body, query, or params against a schema
 */
export const validate = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      })
    }

    // Replace request property with validated value
    req[property] = value
    next()
  }
}

/**
 * Validate numeric ID parameter
 */
export const validateId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params[paramName], 10)

    if (isNaN(id) || id <= 0) {
      throw new AppError(`Invalid ${paramName}: must be a positive integer`, 400)
    }

    // Store parsed ID back to params
    req.params[paramName] = id.toString()
    next()
  }
}

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
