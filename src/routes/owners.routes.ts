import { Router } from 'express'
import * as ownersController from '../controllers/owners.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', ownersController.getAll)
router.get('/:id', ownersController.getById)
router.post('/', ownersController.create)
router.put('/:id', ownersController.update)
router.delete('/:id', ownersController.remove)

export default router
