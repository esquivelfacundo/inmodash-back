import prisma from '../config/database'
import { CreateOwnerDto, UpdateOwnerDto } from '../types'

export const getAll = async (userId: number) => {
  return await prisma.owner.findMany({
    where: { userId },
    include: {
      apartments: {
        include: {
          building: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.owner.findFirst({
    where: { id, userId },
    include: {
      apartments: {
        include: {
          building: true,
          contracts: {
            include: {
              tenant: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
}

export const create = async (data: CreateOwnerDto, userId: number) => {
  return await prisma.owner.create({
    data: {
      userId,
      name: data.name,
      dniOrCuit: data.dniOrCuit,
      phone: data.phone,
      email: data.email,
      address: data.address,
      bankAccount: data.bankAccount,
      commissionPercentage: data.commissionPercentage || 0
    },
    include: {
      apartments: true
    }
  })
}

export const update = async (id: number, data: UpdateOwnerDto, userId: number) => {
  const owner = await getById(id, userId)
  if (!owner) {
    throw new Error('Owner not found or access denied')
  }
  
  return await prisma.owner.update({
    where: { id },
    data: {
      name: data.name,
      dniOrCuit: data.dniOrCuit,
      phone: data.phone,
      email: data.email,
      address: data.address,
      bankAccount: data.bankAccount,
      commissionPercentage: data.commissionPercentage
    },
    include: {
      apartments: true
    }
  })
}

export const remove = async (id: number, userId: number) => {
  // Verificar si tiene departamentos asociados
  const owner = await getById(id, userId)
  
  if (!owner) {
    throw new Error('Owner not found or access denied')
  }

  if (owner.apartments.length > 0) {
    throw new Error('No se puede eliminar un propietario con departamentos asociados')
  }

  return await prisma.owner.delete({
    where: { id }
  })
}
