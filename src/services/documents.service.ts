import prisma from '../config/database'
import { CreateDocumentDto, UpdateDocumentDto } from '../types'

export const getAll = async (userId: number) => {
  return await prisma.document.findMany({
    where: { userId },
    include: {
      tenant: true,
      owner: true,
      contract: true,
      apartment: true
    },
    orderBy: {
      uploadedAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.document.findFirst({
    where: { id, userId },
    include: {
      tenant: true,
      owner: true,
      contract: true,
      apartment: true
    }
  })
}

export const getByTenantId = async (tenantId: number, userId: number) => {
  return await prisma.document.findMany({
    where: { tenantId, userId },
    orderBy: {
      uploadedAt: 'desc'
    }
  })
}

export const getByOwnerId = async (ownerId: number, userId: number) => {
  return await prisma.document.findMany({
    where: { ownerId, userId },
    orderBy: {
      uploadedAt: 'desc'
    }
  })
}

export const getByContractId = async (contractId: number, userId: number) => {
  return await prisma.document.findMany({
    where: { contractId, userId },
    orderBy: {
      uploadedAt: 'desc'
    }
  })
}

export const getByApartmentId = async (apartmentId: number, userId: number) => {
  return await prisma.document.findMany({
    where: { apartmentId, userId },
    orderBy: {
      uploadedAt: 'desc'
    }
  })
}

export const getByType = async (type: string, userId: number) => {
  return await prisma.document.findMany({
    where: { type, userId },
    include: {
      tenant: true,
      owner: true,
      contract: true,
      apartment: true
    },
    orderBy: {
      uploadedAt: 'desc'
    }
  })
}

export const create = async (data: CreateDocumentDto, userId: number) => {
  return await prisma.document.create({
    data: {
      userId,
      type: data.type,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      description: data.description,
      tenantId: data.tenantId,
      ownerId: data.ownerId,
      contractId: data.contractId,
      apartmentId: data.apartmentId
    },
    include: {
      tenant: true,
      owner: true,
      contract: true,
      apartment: true
    }
  })
}

export const update = async (id: number, data: UpdateDocumentDto, userId: number) => {
  const document = await getById(id, userId)
  if (!document) {
    throw new Error('Document not found or access denied')
  }
  
  return await prisma.document.update({
    where: { id },
    data: {
      description: data.description
    },
    include: {
      tenant: true,
      owner: true,
      contract: true,
      apartment: true
    }
  })
}

export const remove = async (id: number, userId: number) => {
  const document = await getById(id, userId)
  if (!document) {
    throw new Error('Document not found or access denied')
  }
  
  return await prisma.document.delete({
    where: { id }
  })
}
