import prisma from '../config/database'
import { CreateGuarantorDto, UpdateGuarantorDto } from '../types'

export const getByTenantId = async (tenantId: number) => {
  return await prisma.guarantor.findMany({
    where: { tenantId },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number) => {
  return await prisma.guarantor.findUnique({
    where: { id },
    include: {
      tenant: true
    }
  })
}

export const create = async (tenantId: number, data: CreateGuarantorDto) => {
  return await prisma.guarantor.create({
    data: {
      tenantId,
      name: data.name,
      dni: data.dni,
      address: data.address,
      email: data.email,
      phone: data.phone
    }
  })
}

export const update = async (id: number, data: UpdateGuarantorDto) => {
  return await prisma.guarantor.update({
    where: { id },
    data: {
      name: data.name,
      dni: data.dni,
      address: data.address,
      email: data.email,
      phone: data.phone
    }
  })
}

export const remove = async (id: number) => {
  return await prisma.guarantor.delete({
    where: { id }
  })
}
