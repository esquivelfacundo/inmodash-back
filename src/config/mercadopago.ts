import { MercadoPagoConfig } from 'mercadopago'

// Determinar si estamos en modo de prueba o producción
const isProduction = process.env.NODE_ENV === 'production'
const useTestCredentials = process.env.MP_USE_TEST === 'true' || !isProduction

// Credenciales de MercadoPago
const accessToken = useTestCredentials
  ? process.env.MP_ACCESS_TOKEN_TEST || ''
  : process.env.MP_ACCESS_TOKEN_PROD || ''

const publicKey = useTestCredentials
  ? process.env.MP_PUBLIC_KEY_TEST || ''
  : process.env.MP_PUBLIC_KEY_PROD || ''

if (!accessToken) {
  throw new Error('MercadoPago Access Token is not configured')
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
    defaultAmount: 289, // USD
    defaultCurrency: 'USD',
    billingFrequency: 1, // Cada 1 mes
    billingFrequencyType: 'months',
    trialDays: 30,
  },
  // URLs de callback y webhook
  webhookUrl: process.env.MP_WEBHOOK_URL || 'https://inmodash-back-production.up.railway.app/api/subscriptions/webhook',
  successUrl: process.env.MP_SUCCESS_URL || 'https://inmodash.com.ar/dashboard?payment=success',
  failureUrl: process.env.MP_FAILURE_URL || 'https://inmodash.com.ar/register?payment=failure',
  pendingUrl: process.env.MP_PENDING_URL || 'https://inmodash.com.ar/dashboard?payment=pending',
}

export default mercadopagoClient
