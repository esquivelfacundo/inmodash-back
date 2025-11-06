import { Request, Response } from 'express'
import { subscriptionService } from '../services/subscription.service'
import { logger } from '../utils/logger'

/**
 * Crear una nueva suscripción
 */
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const { email, plan, amount, currency, cardToken } = req.body

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

    // MercadoPago puede enviar en dos formatos:
    // Formato nuevo: type + data.id
    // Formato antiguo: topic + resource
    const { type, 'data.id': dataId, topic, id } = req.query
    
    // Determinar el tipo de notificación
    let notificationType = type || req.body.type || topic || req.body.topic
    let notificationId = dataId || req.body.data?.id || id || req.body.resource
    
    // Mapear topic antiguo a type nuevo
    if (topic === 'payment' || req.body.topic === 'payment') {
      notificationType = 'payment'
    } else if (topic === 'merchant_order' || req.body.topic === 'merchant_order') {
      notificationType = 'merchant_order'
    }

    const webhookData = {
      type: notificationType,
      action: req.body.action,
      data: {
        id: notificationId,
      },
    }
    
    logger.info('Processing MercadoPago webhook', webhookData)

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
