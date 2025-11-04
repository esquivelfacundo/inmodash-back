import { Router } from 'express'
import * as apartmentsController from '../controllers/apartments.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', apartmentsController.getAll)
router.get('/:id', apartmentsController.getById)
router.get('/building/:buildingId', apartmentsController.getByBuildingId)
router.post('/', apartmentsController.create)
router.put('/:id', apartmentsController.update)
router.delete('/:id', apartmentsController.remove)

export default router
