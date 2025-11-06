import { PrismaClient } from '@prisma/client'
import { PreApproval, PreApprovalPlan, Payment } from 'mercadopago'
import { mercadopagoClient, mercadopagoConfig } from '../config/mercadopago'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface CreateSubscriptionParams {
  userId: number
  email: string
  plan?: string
  amount?: number
  currency?: string
  cardToken: string // Ahora es obligatorio
}

interface SubscriptionResult {
  success: boolean
  subscription?: any
  initPoint?: string
  error?: string
}

export class SubscriptionService {
  private preApprovalClient: PreApproval
  private preApprovalPlanClient: PreApprovalPlan
  private paymentClient: Payment
  private planId: string | null = null

  constructor() {
    this.preApprovalClient = new PreApproval(mercadopagoClient)
    this.preApprovalPlanClient = new PreApprovalPlan(mercadopagoClient)
    this.paymentClient = new Payment(mercadopagoClient)
  }

  /**
   * Crear o obtener el plan de suscripción
   */
  private async getOrCreatePlan(amount: number, currency: string): Promise<string> {
    try {
      // Usar plan fijo hardcodeado (el último creado en MercadoPago)
      // Esto evita crear múltiples planes y asegura que todos usen el mismo
      const FIXED_PLAN_ID = '35c6eb368b2343dd8b5d73b234213ba2' // Plan con external_reference: inmodash-professional-plan
      
      if (FIXED_PLAN_ID) {
        this.planId = FIXED_PLAN_ID
        logger.info('Using fixed plan ID', { planId: this.planId })
        return this.planId
      }

      // Crear un nuevo plan solo si no existe el fijo (fallback)
      // Este código solo se ejecutará si el FIXED_PLAN_ID está vacío
      const today = new Date()
      const billingDay = today.getDate()
      
      const planData = {
        reason: `InmoDash - Plan Professional`,
        external_reference: 'inmodash-professional-plan', // Referencia única del plan
        auto_recurring: {
          frequency: mercadopagoConfig.subscription.billingFrequency,
          frequency_type: mercadopagoConfig.subscription.billingFrequencyType as 'months' | 'days',
          transaction_amount: amount,
          currency_id: currency,
          billing_day: billingDay, // Día actual para cobro inmediato
          billing_day_proportional: false,
        },
        payment_methods_allowed: {
          payment_types: [
            {
              id: 'credit_card',
            },
            {
              id: 'debit_card',
            },
          ],
          payment_methods: [],
        },
        back_url: mercadopagoConfig.successUrl,
      }

      logger.info('Creating MercadoPago subscription plan', planData)

      const plan = await this.preApprovalPlanClient.create({ body: planData })

      logger.info('MercadoPago plan created', {
        id: plan.id,
        external_reference: 'inmodash-professional-plan',
      })

      this.planId = plan.id!
      return this.planId
    } catch (error) {
      logger.error('Error creating subscription plan', error)
      throw error
    }
  }

  /**
   * Crear una suscripción recurrente en MercadoPago con plan asociado
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    try {
      const {
        userId,
        email,
        plan = mercadopagoConfig.subscription.defaultPlan,
        amount = mercadopagoConfig.subscription.defaultAmount,
        currency = mercadopagoConfig.subscription.defaultCurrency,
        cardToken,
      } = params

      logger.info('Creating subscription for user', { 
        userId, 
        email, 
        plan, 
        amount,
        hasCardToken: !!cardToken,
        isProduction: mercadopagoConfig.isProduction,
        useTestCredentials: mercadopagoConfig.useTestCredentials,
        accessTokenPrefix: mercadopagoConfig.accessToken.substring(0, 20) + '...'
      })

      // Obtener o crear el plan de suscripción
      const planId = await this.getOrCreatePlan(amount, currency)

      // Calcular fechas
      const startDate = new Date()
      const nextBillingDate = new Date()
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

      // Crear preapproval (suscripción) con plan asociado
      // No enviamos auto_recurring porque ya está en el plan
      const preApprovalData: any = {
        preapproval_plan_id: planId,
        reason: `InmoDash - Plan ${plan}`,
        external_reference: `user_${userId}`,
        payer_email: email,
        card_token_id: cardToken,
        back_url: mercadopagoConfig.successUrl,
        status: 'authorized' as const, // Autorizado desde el inicio
      }

      logger.info('Creating MercadoPago preapproval with plan', {
        planId,
        ...preApprovalData,
        card_token_id: '***' // No loguear el token completo
      })

      const preApproval = await this.preApprovalClient.create({ body: preApprovalData })

      logger.info('MercadoPago preapproval created', {
        id: preApproval.id,
        status: preApproval.status,
      })

      // Guardar suscripción en la base de datos PRIMERO
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          mercadopagoPreapprovalId: preApproval.id,
          plan,
          status: 'authorized', // Autorizada desde el inicio
          amount,
          currency,
          frequency: mercadopagoConfig.subscription.billingFrequency,
          frequencyType: mercadopagoConfig.subscription.billingFrequencyType,
          startDate,
          isTrialActive: false, // Sin trial
          trialEndDate: null,
          nextBillingDate, // Próximo cobro en 1 mes
        },
      })

      // Actualizar usuario con suscripción activa
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          subscriptionStartDate: startDate,
          nextPaymentDate: nextBillingDate,
        },
      })

      logger.info('Subscription created in database', { 
        subscriptionId: subscription.id,
      })

      // MercadoPago procesará el primer pago automáticamente
      // El webhook recibirá la notificación y guardará el pago en la BD
      logger.info('Waiting for MercadoPago to process first payment automatically')

      return {
        success: true,
        subscription,
        // No hay initPoint porque la suscripción ya está autorizada
      }
    } catch (error) {
      logger.error('Error creating subscription', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorDetails: JSON.stringify(error, null, 2)
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }
    }
  }

  /**
   * Procesar webhook de MercadoPago
   */
  async processWebhook(data: any): Promise<void> {
    try {
      logger.info('Processing MercadoPago webhook', data)

      const { type, action, data: webhookData } = data

      // Procesar según el tipo de notificación
      switch (type) {
        case 'subscription_preapproval':
          await this.handlePreapprovalNotification(webhookData.id, action)
          break

        case 'subscription_authorized_payment':
        case 'payment':
          await this.handlePaymentNotification(webhookData.id)
          break

        default:
          logger.info('Unhandled webhook type', { type })
      }
    } catch (error) {
      logger.error('Error processing webhook', error)
      throw error
    }
  }

  /**
   * Manejar notificación de preapproval (suscripción)
   */
  private async handlePreapprovalNotification(preapprovalId: string, action: string): Promise<void> {
    try {
      logger.info('Handling preapproval notification', { preapprovalId, action })

      // Obtener información actualizada de MercadoPago
      const preApproval = await this.preApprovalClient.get({ id: preapprovalId })

      // Buscar suscripción en la base de datos
      const subscription = await prisma.subscription.findUnique({
        where: { mercadopagoPreapprovalId: preapprovalId },
        include: { user: true },
      })

      if (!subscription) {
        logger.error('Subscription not found', { preapprovalId })
        return
      }

      // Actualizar estado de la suscripción
      const updateData: any = {
        status: preApproval.status,
        updatedAt: new Date(),
      }

      // Si la suscripción fue autorizada
      if (preApproval.status === 'authorized') {
        updateData.isTrialActive = false

        // Actualizar usuario
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            subscriptionStatus: 'active',
          },
        })
      }

      // Si la suscripción fue cancelada o pausada
      if (preApproval.status === 'cancelled' || preApproval.status === 'paused') {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            subscriptionStatus: preApproval.status,
          },
        })
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: updateData,
      })

      logger.info('Subscription updated', { subscriptionId: subscription.id, status: preApproval.status })
    } catch (error) {
      logger.error('Error handling preapproval notification', error)
      throw error
    }
  }

  /**
   * Manejar notificación de pago
   */
  private async handlePaymentNotification(paymentId: string): Promise<void> {
    try {
      logger.info('Handling payment notification', { paymentId })

      // Obtener información del pago de MercadoPago
      const payment = await this.paymentClient.get({ id: paymentId })

      logger.info('Payment details', {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        externalReference: payment.external_reference,
        payerEmail: payment.payer?.email,
      })

      // Buscar suscripción asociada
      let subscription = null
      
      // 1. Intentar buscar por preapproval_id en metadata
      if (payment.metadata?.preapproval_id) {
        subscription = await prisma.subscription.findFirst({
          where: { 
            mercadopagoPreapprovalId: payment.metadata.preapproval_id,
            status: { in: ['pending', 'authorized', 'paused'] }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        if (subscription) {
          logger.info('Subscription found by preapproval_id', {
            subscriptionId: subscription.id,
            preapprovalId: payment.metadata.preapproval_id
          })
        }
      }
      
      // 2. Intentar buscar por external_reference (formato: user_X)
      if (!subscription && payment.external_reference) {
        const match = payment.external_reference.match(/user_(\d+)/)
        if (match) {
          const userId = parseInt(match[1])
          subscription = await prisma.subscription.findFirst({
            where: { 
              userId,
              status: { in: ['pending', 'authorized', 'paused'] }
            },
            orderBy: { createdAt: 'desc' }
          })
          
          if (subscription) {
            logger.info('Subscription found by external_reference', {
              subscriptionId: subscription.id,
              userId
            })
          }
        }
      }

      // 3. Si no se encontró, buscar por email del pagador
      if (!subscription && payment.payer?.email) {
        const user = await prisma.user.findUnique({
          where: { email: payment.payer.email }
        })
        
        if (user) {
          subscription = await prisma.subscription.findFirst({
            where: { 
              userId: user.id,
              status: { in: ['pending', 'authorized', 'paused'] }
            },
            orderBy: { createdAt: 'desc' }
          })
        }
      }

      if (!subscription) {
        logger.error('Subscription not found for payment', { 
          paymentId, 
          externalReference: payment.external_reference,
          payerEmail: payment.payer?.email
        })
        return
      }

      logger.info('Subscription found for payment', {
        subscriptionId: subscription.id,
        userId: subscription.userId
      })

      // Registrar el pago
      await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          mercadopagoPaymentId: payment.id!.toString(),
          amount: payment.transaction_amount!,
          currency: payment.currency_id!,
          status: payment.status!,
          statusDetail: payment.status_detail || null,
          paymentMethodId: payment.payment_method_id || null,
          paymentType: payment.payment_type_id || null,
          paidAt: payment.date_approved ? new Date(payment.date_approved) : null,
          metadata: JSON.stringify(payment),
        },
      })

      // Actualizar suscripción con último pago
      const updateData: any = {
        lastPaymentDate: new Date(),
        lastPaymentStatus: payment.status,
        lastPaymentAmount: payment.transaction_amount,
      }

      // Si el pago fue aprobado, calcular próxima fecha de cobro
      if (payment.status === 'approved') {
        const nextBillingDate = new Date()
        nextBillingDate.setMonth(nextBillingDate.getMonth() + subscription.frequency)
        updateData.nextBillingDate = nextBillingDate

        // Actualizar usuario
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            subscriptionStatus: 'active',
            lastPaymentDate: new Date(),
            nextPaymentDate: nextBillingDate,
          },
        })
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: updateData,
      })

      logger.info('Payment processed successfully', { paymentId, subscriptionId: subscription.id })
    } catch (error) {
      logger.error('Error handling payment notification', error)
      throw error
    }
  }

  /**
   * Obtener suscripción de un usuario
   */
  async getUserSubscription(userId: number) {
    try {
      // Solo devolver suscripciones autorizadas o pausadas
      // No devolver suscripciones pendientes (esperando pago)
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['authorized', 'paused'] },
        },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return subscription
    } catch (error) {
      logger.error('Error getting user subscription', error)
      throw error
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(userId: number): Promise<SubscriptionResult> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'authorized'] },
        },
      })

      if (!subscription) {
        return {
          success: false,
          error: 'No active subscription found',
        }
      }

      if (subscription.mercadopagoPreapprovalId) {
        // Cancelar en MercadoPago
        await this.preApprovalClient.update({
          id: subscription.mercadopagoPreapprovalId,
          body: { status: 'cancelled' },
        })
      }

      // Actualizar en base de datos
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
          endDate: new Date(),
        },
      })

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'cancelled',
        },
      })

      return {
        success: true,
        subscription,
      }
    } catch (error) {
      logger.error('Error canceling subscription', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const subscriptionService = new SubscriptionService()
