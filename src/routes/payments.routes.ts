import { Router } from 'express'
import * as paymentsController from '../controllers/payments.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get all payments
router.get('/', paymentsController.getAll)

// Get pending payments
router.get('/pending', paymentsController.getPending)

// Get overdue payments
router.get('/overdue', paymentsController.getOverdue)

// Mark overdue payments (utility endpoint)
router.post('/mark-overdue', paymentsController.markOverdue)

// Get payments by contract
router.get('/contract/:contractId', paymentsController.getByContractId)

// Get payment by ID
router.get('/:id', paymentsController.getById)

// Create payment
router.post('/', paymentsController.create)

// Update payment
router.put('/:id', paymentsController.update)

// Mark payment as paid
router.post('/:id/mark-paid', paymentsController.markAsPaid)

// Delete payment
router.delete('/:id', paymentsController.remove)

export default router
