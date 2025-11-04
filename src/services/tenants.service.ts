import prisma from '../config/database'
import { CreateTenantDto, UpdateTenantDto } from '../types'

export const getAll = async (userId: number) => {
  return await prisma.tenant.findMany({
    where: { userId },
    include: {
      guarantors: true,
      contracts: {
        include: {
          apartment: {
            include: {
              building: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.tenant.findFirst({
    where: { id, userId },
    include: {
      guarantors: true,
      contracts: {
        include: {
          apartment: {
            include: {
              building: true
            }
          },
          updateRule: {
            include: {
              updatePeriods: true
            }
          }
        }
      },
      rentalHistory: true
    }
  })
}

export const create = async (data: CreateTenantDto, userId: number) => {
  return await prisma.tenant.create({
    data: {
      userId,
      nameOrBusiness: data.nameOrBusiness,
      dniOrCuit: data.dniOrCuit,
      address: data.address,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      contactAddress: data.contactAddress
    },
    include: {
      guarantors: true
    }
  })
}

export const update = async (id: number, data: UpdateTenantDto, userId: number) => {
  const tenant = await getById(id, userId)
  if (!tenant) {
    throw new Error('Tenant not found or access denied')
  }
  
  return await prisma.tenant.update({
    where: { id },
    data: {
      nameOrBusiness: data.nameOrBusiness,
      dniOrCuit: data.dniOrCuit,
      address: data.address,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      contactAddress: data.contactAddress
    },
    include: {
      guarantors: true,
      contracts: true
    }
  })
}

export const remove = async (id: number, userId: number) => {
  const tenant = await getById(id, userId)
  if (!tenant) {
    throw new Error('Tenant not found or access denied')
  }
  
  // Prisma eliminará automáticamente contracts y guarantors por CASCADE
  return await prisma.tenant.delete({
    where: { id }
  })
}
