import { Router } from 'express'
import * as buildingsController from '../controllers/buildings.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', buildingsController.getAll)
router.get('/:id', buildingsController.getById)
router.post('/', buildingsController.create)
router.put('/:id', buildingsController.update)
router.delete('/:id', buildingsController.remove)

export default router
