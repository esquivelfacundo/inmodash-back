import { Request, Response } from 'express'
import { subscriptionService } from '../services/subscription.service'
import { logger } from '../utils/logger'

/**
 * Crear una nueva suscripción
 */
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const { email, plan, amount, currency, paymentMethodId, cardToken } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    logger.info('Creating subscription', { userId, email, plan })

    const result = await subscriptionService.createSubscription({
      userId,
      email,
      plan,
      amount,
      currency,
      paymentMethodId,
      cardToken,
    })

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.status(201).json({
      success: true,
      subscription: result.subscription,
      initPoint: result.initPoint,
    })
  } catch (error) {
    logger.error('Error in createSubscription controller', error)
    res.status(500).json({ error: 'Failed to create subscription' })
  }
}

/**
 * Obtener suscripción del usuario actual
 */
export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const subscription = await subscriptionService.getUserSubscription(userId)

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' })
    }

    res.json({
      success: true,
      subscription,
    })
  } catch (error) {
    logger.error('Error in getMySubscription controller', error)
    res.status(500).json({ error: 'Failed to get subscription' })
  }
}

/**
 * Cancelar suscripción del usuario actual
 */
export const cancelMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await subscriptionService.cancelSubscription(userId)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: result.subscription,
    })
  } catch (error) {
    logger.error('Error in cancelMySubscription controller', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
}

/**
 * Webhook de MercadoPago
 * Este endpoint recibe notificaciones de MercadoPago sobre cambios en suscripciones y pagos
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    logger.info('Received MercadoPago webhook', {
      body: req.body,
      query: req.query,
    })

    // MercadoPago envía el tipo de notificación en el query string
    const { type, 'data.id': dataId } = req.query

    // También puede venir en el body
    const webhookData = {
      type: type || req.body.type,
      action: req.body.action,
      data: {
        id: dataId || req.body.data?.id,
      },
    }

    // Procesar el webhook de forma asíncrona
    await subscriptionService.processWebhook(webhookData)

    // Responder inmediatamente a MercadoPago
    res.status(200).json({ success: true })
  } catch (error) {
    logger.error('Error in webhook handler', error)
    // Aún así responder 200 para que MercadoPago no reintente
    res.status(200).json({ success: false })
  }
}
