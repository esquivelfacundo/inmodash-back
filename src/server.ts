import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import config from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { securityHeaders, requestLogger, sanitizeInput } from './middleware/security'
import { logger } from './utils/logger'

const app = express()

// Security: Disable X-Powered-By header
app.disable('x-powered-by')

// Security headers
app.use(securityHeaders)

// Request logging
if (config.isDevelopment) {
  app.use(requestLogger)
}

// CORS configuration - Allow multiple domains
const allowedOrigins = [
  'https://inmodash-front.vercel.app',
  'https://inmodash.com.ar',
  'https://www.inmodash.com.ar',
  'http://localhost:3000' // For local development
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel preview deployments
    if (origin && (
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.endsWith('.vercel.app')
    )) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Cookie parser
app.use(cookieParser())

// Body parser with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Input sanitization
app.use(sanitizeInput)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.1.0' // WhatsApp Bot Phase 1
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Sistema de Gestión Inmobiliaria - API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      buildings: '/api/buildings',
      apartments: '/api/apartments',
      tenants: '/api/tenants',
      guarantors: '/api/guarantors',
      contracts: '/api/contracts',
      dashboard: '/api/dashboard/stats',
      owners: '/api/owners',
      payments: '/api/payments',
      documents: '/api/documents'
    },
    documentation: 'Ver QUICK_START.md para más información'
  })
})

// Importar rutas
import authRoutes from './routes/auth.routes'
import buildingsRoutes from './routes/buildings.routes'
import apartmentsRoutes from './routes/apartments.routes'
import tenantsRoutes from './routes/tenants.routes'
import guarantorsRoutes from './routes/guarantors.routes'
import contractsRoutes from './routes/contracts.routes'
import dashboardRoutes from './routes/dashboard.routes'
import ownersRoutes from './routes/owners.routes'
import paymentsRoutes from './routes/payments.routes'
import documentsRoutes from './routes/documents.routes'
import migrationRoutes from './routes/migration.routes'
import whatsappRoutes from './whatsapp/routes/index'
import subscriptionRoutes from './routes/subscription.routes'
import { authenticate } from './middleware/auth'

// Usar rutas
app.use('/api/auth', authRoutes)
app.use('/api/buildings', buildingsRoutes)
app.use('/api/apartments', apartmentsRoutes)
app.use('/api/tenants', tenantsRoutes)
app.use('/api/guarantors', guarantorsRoutes)
app.use('/api/contracts', contractsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/owners', ownersRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/migration', migrationRoutes)
// WhatsApp routes - webhook endpoints don't need auth, config endpoints do
app.use('/api/whatsapp', whatsappRoutes)
// Subscription routes - MercadoPago integration
app.use('/api/subscriptions', subscriptionRoutes)

// Error handler (debe ser el último middleware)
app.use(errorHandler)

// Iniciar servidor
app.listen(config.port, () => {
  logger.serverStart(config.port, config.nodeEnv)
})

// Manejo de errores no capturados
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection', err)
  process.exit(1)
})

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception', err)
  process.exit(1)
})
