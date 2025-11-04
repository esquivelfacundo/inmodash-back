import { Request, Response, NextFunction } from 'express'
import * as paymentsService from '../services/payments.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const payments = await paymentsService.getAll(userId)
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const payment = await paymentsService.getById(parseInt(id), userId)
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' })
    }
    
    res.json(payment)
  } catch (error) {
    next(error)
  }
}

export const getByContractId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params
    const userId = req.user!.userId
    const payments = await paymentsService.getByContractId(parseInt(contractId), userId)
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

export const getPending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const payments = await paymentsService.getPendingPayments(userId)
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

export const getOverdue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const payments = await paymentsService.getOverduePayments(userId)
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const payment = await paymentsService.create(req.body, userId)
    res.status(201).json(payment)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const payment = await paymentsService.update(parseInt(id), req.body, userId)
    res.json(payment)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await paymentsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const markAsPaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const { paymentDate } = req.body
    const payment = await paymentsService.markAsPaid(parseInt(id), userId, paymentDate)
    res.json(payment)
  } catch (error) {
    next(error)
  }
}

export const markOverdue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const result = await paymentsService.markOverduePayments(userId)
    res.json({ 
      message: 'Pagos vencidos actualizados',
      count: result.count 
    })
  } catch (error) {
    next(error)
  }
}
