import { Request, Response, NextFunction } from 'express'
import * as apartmentsService from '../services/apartments.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apartments = await apartmentsService.getAll()
    res.json(apartments)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const apartment = await apartmentsService.getById(parseInt(id))
    
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
    const apartments = await apartmentsService.getByBuildingId(parseInt(buildingId))
    res.json(apartments)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apartment = await apartmentsService.create(req.body)
    res.status(201).json(apartment)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const apartment = await apartmentsService.update(parseInt(id), req.body)
    res.json(apartment)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    await apartmentsService.remove(parseInt(id))
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
