import { Router } from 'express'
import * as tenantsController from '../controllers/tenants.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', tenantsController.getAll)
router.get('/:id', tenantsController.getById)
router.post('/', tenantsController.create)
router.put('/:id', tenantsController.update)
router.delete('/:id', tenantsController.remove)

export default router
