import { Request, Response, NextFunction } from 'express'
import * as guarantorsService from '../services/guarantors.service'

export const getByTenantId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params
    const guarantors = await guarantorsService.getByTenantId(parseInt(tenantId))
    res.json(guarantors)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const guarantor = await guarantorsService.getById(parseInt(id))
    
    if (!guarantor) {
      return res.status(404).json({ error: 'Garante no encontrado' })
    }
    
    res.json(guarantor)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params
    const guarantor = await guarantorsService.create(parseInt(tenantId), req.body)
    res.status(201).json(guarantor)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const guarantor = await guarantorsService.update(parseInt(id), req.body)
    res.json(guarantor)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    await guarantorsService.remove(parseInt(id))
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
