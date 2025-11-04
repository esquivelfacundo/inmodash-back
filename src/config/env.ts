/**
 * Environment configuration
 * Centralized configuration for environment variables
 */

import dotenv from 'dotenv'

dotenv.config()

interface Config {
  port: number
  nodeEnv: string
  frontendUrl: string
  databaseUrl: string
  jwtSecret: string
  isDevelopment: boolean
  isProduction: boolean
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3975',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production'
}

// Validate required environment variables
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

export default config
