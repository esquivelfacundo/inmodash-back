import { Request, Response, NextFunction } from 'express'
import * as buildingsService from '../services/buildings.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const buildings = await buildingsService.getAll(userId)
    res.json(buildings)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const building = await buildingsService.getById(parseInt(id), userId)
    
    if (!building) {
      return res.status(404).json({ error: 'Edificio no encontrado' })
    }
    
    res.json(building)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const building = await buildingsService.create(req.body, userId)
    res.status(201).json(building)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const building = await buildingsService.update(parseInt(id), req.body, userId)
    res.json(building)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await buildingsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
