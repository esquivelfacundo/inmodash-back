import { Router } from 'express'
import * as guarantorsController from '../controllers/guarantors.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/tenant/:tenantId', guarantorsController.getByTenantId)
router.get('/:id', guarantorsController.getById)
router.post('/tenant/:tenantId', guarantorsController.create)
router.put('/:id', guarantorsController.update)
router.delete('/:id', guarantorsController.remove)

export default router
