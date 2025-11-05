import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  createSubscription,
  getMySubscription,
  cancelMySubscription,
  handleWebhook,
} from '../controllers/subscription.controller'

const router = Router()

/**
 * POST /api/subscriptions/create
 * Crear una nueva suscripción (requiere autenticación)
 */
router.post('/create', authenticate, createSubscription)

/**
 * GET /api/subscriptions/me
 * Obtener suscripción del usuario actual (requiere autenticación)
 */
router.get('/me', authenticate, getMySubscription)

/**
 * POST /api/subscriptions/cancel
 * Cancelar suscripción del usuario actual (requiere autenticación)
 */
router.post('/cancel', authenticate, cancelMySubscription)

/**
 * POST /api/subscriptions/webhook
 * Webhook de MercadoPago (NO requiere autenticación)
 * Este endpoint recibe notificaciones de MercadoPago
 */
router.post('/webhook', handleWebhook)

/**
 * GET /api/subscriptions/webhook
 * MercadoPago también puede enviar notificaciones por GET
 */
router.get('/webhook', handleWebhook)

export default router
