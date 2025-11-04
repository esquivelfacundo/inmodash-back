import { Request, Response, NextFunction } from 'express'
import * as apartmentsService from '../services/apartments.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const apartments = await apartmentsService.getAll(userId)
    res.json(apartments)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const apartment = await apartmentsService.getById(parseInt(id), userId)
    
    if (!apartment) {
      return res.status(404).json({ error: 'Departamento no encontrado' })
    }
    
    res.json(apartment)
  } catch (error) {
    next(error)
  }
}

export const getByBuildingId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { buildingId } = req.params
    const userId = req.user!.userId
    const apartments = await apartmentsService.getByBuildingId(parseInt(buildingId), userId)
    res.json(apartments)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const apartment = await apartmentsService.create(req.body, userId)
    res.status(201).json(apartment)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const apartment = await apartmentsService.update(parseInt(id), req.body, userId)
    res.json(apartment)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await apartmentsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
