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

/**
 * DELETE /api/subscriptions/clean-all
 * TEMPORARY: Clean all subscriptions (for testing)
 */
router.delete('/clean-all', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // Delete all subscription payments first
    const deletedPayments = await prisma.subscriptionPayment.deleteMany({})
    
    // Delete all subscriptions
    const deletedSubscriptions = await prisma.subscription.deleteMany({})
    
    // Reset user subscription status
    const updatedUsers = await prisma.user.updateMany({
      where: {
        subscriptionStatus: { not: undefined }
      },
      data: {
        subscriptionStatus: undefined,
        subscriptionPlan: undefined,
        subscriptionStartDate: undefined,
        subscriptionEndDate: undefined,
        lastPaymentDate: undefined,
        nextPaymentDate: undefined,
      },
    })

    await prisma.$disconnect()

    res.json({
      success: true,
      message: 'All subscriptions cleaned',
      deletedPayments: deletedPayments.count,
      deletedSubscriptions: deletedSubscriptions.count,
      updatedUsers: updatedUsers.count,
    })
  } catch (error) {
    console.error('Error cleaning subscriptions:', error)
    res.status(500).json({ error: 'Failed to clean subscriptions' })
  }
})

export default router
