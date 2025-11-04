import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${req.method} ${req.path}`, err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}
