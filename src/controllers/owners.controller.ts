import { Request, Response, NextFunction } from 'express'
import * as ownersService from '../services/owners.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const owners = await ownersService.getAll(userId)
    res.json(owners)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const owner = await ownersService.getById(parseInt(id), userId)
    
    if (!owner) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }
    
    res.json(owner)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const owner = await ownersService.create(req.body, userId)
    res.status(201).json(owner)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const owner = await ownersService.update(parseInt(id), req.body, userId)
    res.json(owner)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await ownersService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
