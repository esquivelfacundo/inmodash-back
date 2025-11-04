import { Router } from 'express'
import * as documentsController from '../controllers/documents.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get all documents
router.get('/', documentsController.getAll)

// Get documents by type
router.get('/type/:type', documentsController.getByType)

// Get documents by tenant
router.get('/tenant/:tenantId', documentsController.getByTenantId)

// Get documents by owner
router.get('/owner/:ownerId', documentsController.getByOwnerId)

// Get documents by contract
router.get('/contract/:contractId', documentsController.getByContractId)

// Get documents by apartment
router.get('/apartment/:apartmentId', documentsController.getByApartmentId)

// Get document by ID
router.get('/:id', documentsController.getById)

// Create document
router.post('/', documentsController.create)

// Update document
router.put('/:id', documentsController.update)

// Delete document
router.delete('/:id', documentsController.remove)

export default router
