import { PrismaClient } from '@prisma/client'
import { PreApproval, Payment } from 'mercadopago'
import { mercadopagoClient, mercadopagoConfig } from '../config/mercadopago'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface CreateSubscriptionParams {
  userId: number
  email: string
  plan?: string
  amount?: number
  currency?: string
  paymentMethodId?: string
  cardToken?: string
}

interface SubscriptionResult {
  success: boolean
  subscription?: any
  initPoint?: string
  error?: string
}

export class SubscriptionService {
  private preApprovalClient: PreApproval
  private paymentClient: Payment

  constructor() {
    this.preApprovalClient = new PreApproval(mercadopagoClient)
    this.paymentClient = new Payment(mercadopagoClient)
  }

  /**
   * Crear una suscripción recurrente en MercadoPago
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    try {
      const {
        userId,
        email,
        plan = mercadopagoConfig.subscription.defaultPlan,
        amount = mercadopagoConfig.subscription.defaultAmount,
        currency = mercadopagoConfig.subscription.defaultCurrency,
      } = params

      logger.info('Creating subscription for user', { userId, email, plan, amount })

      // Calcular fechas
      const startDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + mercadopagoConfig.subscription.trialDays)

      // Crear preapproval (suscripción) en MercadoPago
      const preApprovalData = {
        reason: `InmoDash - Plan ${plan}`,
        auto_recurring: {
          frequency: mercadopagoConfig.subscription.billingFrequency,
          frequency_type: mercadopagoConfig.subscription.billingFrequencyType as 'months' | 'days',
          transaction_amount: amount,
          currency_id: currency,
          free_trial: {
            frequency: mercadopagoConfig.subscription.trialDays,
            frequency_type: 'days' as const,
          },
        },
        back_url: mercadopagoConfig.successUrl,
        payer_email: email,
        status: 'pending' as const,
      }

      logger.info('Creating MercadoPago preapproval', preApprovalData)

      const preApproval = await this.preApprovalClient.create({ body: preApprovalData })

      logger.info('MercadoPago preapproval created', {
        id: preApproval.id,
        status: preApproval.status,
        initPoint: preApproval.init_point,
      })

      // Guardar suscripción en la base de datos
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          mercadopagoPreapprovalId: preApproval.id,
          plan,
          status: 'pending',
          amount,
          currency,
          frequency: mercadopagoConfig.subscription.billingFrequency,
          frequencyType: mercadopagoConfig.subscription.billingFrequencyType,
          startDate,
          isTrialActive: true,
          trialEndDate,
          nextBillingDate: trialEndDate,
        },
      })

      // Actualizar usuario con información de suscripción
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'trial',
          subscriptionPlan: plan,
          subscriptionStartDate: startDate,
          trialEndsAt: trialEndDate,
          nextPaymentDate: trialEndDate,
        },
      })

      logger.info('Subscription created in database', { subscriptionId: subscription.id })

      return {
        success: true,
        subscription,
        initPoint: preApproval.init_point,
      }
    } catch (error) {
      logger.error('Error creating subscription', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      })

      // Buscar suscripción asociada
      const preapprovalId = payment.metadata?.preapproval_id

      if (!preapprovalId) {
        logger.warn('Payment without preapproval_id', { paymentId })
        return
      }

      const subscription = await prisma.subscription.findUnique({
        where: { mercadopagoPreapprovalId: preapprovalId },
      })

      if (!subscription) {
        logger.error('Subscription not found for payment', { paymentId, preapprovalId })
        return
      }

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
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'authorized', 'paused'] },
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
