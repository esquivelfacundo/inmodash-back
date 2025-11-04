import { Request, Response, NextFunction } from 'express'
import * as tenantsService from '../services/tenants.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const tenants = await tenantsService.getAll(userId)
    res.json(tenants)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const tenant = await tenantsService.getById(parseInt(id), userId)
    
    if (!tenant) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    
    res.json(tenant)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const tenant = await tenantsService.create(req.body, userId)
    res.status(201).json(tenant)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const tenant = await tenantsService.update(parseInt(id), req.body, userId)
    res.json(tenant)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await tenantsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
