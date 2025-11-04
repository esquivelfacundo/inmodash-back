import { Request, Response, NextFunction } from 'express'
import * as documentsService from '../services/documents.service'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const documents = await documentsService.getAll(userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const document = await documentsService.getById(parseInt(id), userId)
    
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' })
    }
    
    res.json(document)
  } catch (error) {
    next(error)
  }
}

export const getByTenantId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByTenantId(parseInt(tenantId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByOwnerId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByOwnerId(parseInt(ownerId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByContractId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByContractId(parseInt(contractId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByApartmentId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apartmentId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByApartmentId(parseInt(apartmentId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByType(type, userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const document = await documentsService.create(req.body, userId)
    res.status(201).json(document)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const document = await documentsService.update(parseInt(id), req.body, userId)
    res.json(document)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await documentsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
