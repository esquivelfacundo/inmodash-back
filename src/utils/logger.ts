/**
 * Logger utility for consistent logging across the application
 * Provides different log levels and formatted output
 */

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  DEBUG = 'DEBUG'
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production'

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`
    }
    return `${prefix} ${message}`
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, data))
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, data))
  }

  error(message: string, error?: any): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error
    console.error(this.formatMessage(LogLevel.ERROR, message, errorData))
  }

  success(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.SUCCESS, message, data))
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data))
    }
  }

  /**
   * Log server startup information
   */
  serverStart(port: number | string, environment: string): void {
    console.log('\n🚀 ========================================')
    console.log(`   API Backend - Sistema Inmobiliaria`)
    console.log('   ========================================')
    console.log(`   🌐 Servidor: http://localhost:${port}`)
    console.log(`   📊 Prisma Studio: npm run prisma:studio`)
    console.log(`   🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3975'}`)
    console.log(`   📝 Entorno: ${environment}`)
    console.log('   ========================================\n')
  }
}

export const logger = new Logger()
