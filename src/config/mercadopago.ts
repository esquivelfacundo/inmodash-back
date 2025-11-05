import { MercadoPagoConfig } from 'mercadopago'

// Determinar si estamos en modo de prueba o producción
// Solo usar TEST si MP_USE_TEST está explícitamente en 'true'
const useTestCredentials = process.env.MP_USE_TEST === 'true'
// isProduction debe ser false si estamos usando credenciales de test
const isProduction = !useTestCredentials && process.env.NODE_ENV === 'production'

console.log('🔧 MercadoPago Config:', {
  NODE_ENV: process.env.NODE_ENV,
  MP_USE_TEST: process.env.MP_USE_TEST,
  isProduction,
  useTestCredentials,
  hasTestToken: !!process.env.MP_ACCESS_TOKEN_TEST,
  hasProdToken: !!process.env.MP_ACCESS_TOKEN_PROD,
})

// Credenciales de MercadoPago
const accessToken = useTestCredentials
  ? process.env.MP_ACCESS_TOKEN_TEST || ''
  : process.env.MP_ACCESS_TOKEN_PROD || ''

const publicKey = useTestCredentials
  ? process.env.MP_PUBLIC_KEY_TEST || ''
  : process.env.MP_PUBLIC_KEY_PROD || ''

if (!accessToken) {
  throw new Error(`MercadoPago Access Token is not configured. Using ${useTestCredentials ? 'TEST' : 'PROD'} credentials.`)
}

// Configuración del cliente de MercadoPago
export const mercadopagoClient = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 5000,
    idempotencyKey: 'your-idempotency-key', // Se puede personalizar por request
  },
})

// Exportar información de configuración
export const mercadopagoConfig = {
  accessToken,
  publicKey,
  isProduction,
  useTestCredentials,
  // Configuración de suscripciones
  subscription: {
    defaultPlan: 'professional',
    defaultAmount: 15, // ARS (mínimo de MercadoPago)
    defaultCurrency: 'ARS',
    billingFrequency: 1, // Cada 1 mes
    billingFrequencyType: 'months',
    trialDays: 0, // Sin período de prueba
  },
  // URLs de callback y webhook
  webhookUrl: process.env.MP_WEBHOOK_URL || 'https://inmodash-back-production.up.railway.app/api/subscriptions/webhook',
  successUrl: process.env.MP_SUCCESS_URL || 'https://inmodash.com.ar/dashboard?payment=success',
  failureUrl: process.env.MP_FAILURE_URL || 'https://inmodash.com.ar/register?payment=failure',
  pendingUrl: process.env.MP_PENDING_URL || 'https://inmodash.com.ar/dashboard?payment=pending',
}

export default mercadopagoClient
