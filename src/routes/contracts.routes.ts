import { Router } from 'express'
import * as contractsController from '../controllers/contracts.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', contractsController.getAll)
router.get('/:id', contractsController.getById)
router.get('/apartment/:apartmentId', contractsController.getByApartmentId)
router.get('/tenant/:tenantId', contractsController.getByTenantId)
router.post('/', contractsController.create)
router.put('/:id', contractsController.update)
router.delete('/:id', contractsController.remove)

export default router
