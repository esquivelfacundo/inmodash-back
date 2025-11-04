import { Request, Response, NextFunction } from 'express'
import * as contractsService from '../services/contracts.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const contracts = await contractsService.getAll(userId)
    res.json(contracts)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const contract = await contractsService.getById(parseInt(id), userId)
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }
    
    res.json(contract)
  } catch (error) {
    next(error)
  }
}

export const getByApartmentId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apartmentId } = req.params
    const userId = req.user!.userId
    const contracts = await contractsService.getByApartmentId(parseInt(apartmentId), userId)
    res.json(contracts)
  } catch (error) {
    next(error)
  }
}

export const getByTenantId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params
    const userId = req.user!.userId
    const contracts = await contractsService.getByTenantId(parseInt(tenantId), userId)
    res.json(contracts)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const contract = await contractsService.create(req.body, userId)
    res.status(201).json(contract)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const contract = await contractsService.update(parseInt(id), req.body, userId)
    res.json(contract)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await contractsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
