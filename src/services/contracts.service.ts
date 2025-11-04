import prisma from '../config/database'
import { CreateContractDto, UpdateContractDto } from '../types'

export const getAll = async (userId: number) => {
  return await prisma.contract.findMany({
    where: { userId },
    include: {
      apartment: {
        include: {
          building: true
        }
      },
      tenant: {
        include: {
          guarantors: true
        }
      },
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.contract.findFirst({
    where: { id, userId },
    include: {
      apartment: {
        include: {
          building: true
        }
      },
      tenant: {
        include: {
          guarantors: true
        }
      },
      updateRule: {
        include: {
          updatePeriods: true
        }
      },
      guarantors: true
    }
  })
}

export const getByApartmentId = async (apartmentId: number, userId: number) => {
  return await prisma.contract.findMany({
    where: { apartmentId, userId },
    include: {
      tenant: true,
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getByTenantId = async (tenantId: number, userId: number) => {
  return await prisma.contract.findMany({
    where: { tenantId, userId },
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const create = async (data: CreateContractDto, userId: number) => {
  // Crear contrato con update rule y períodos
  const contract = await prisma.contract.create({
    data: {
      userId,
      apartmentId: data.apartmentId,
      tenantId: data.tenantId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      initialAmount: data.initialAmount,
      updateRule: {
        create: {
          updateFrequency: data.updateRule.updateFrequency,
          monthlyCoefficient: data.updateRule.monthlyCoefficient,
          lateInterestPercent: data.updateRule.lateInterest?.percent,
          lateInterestFrequency: data.updateRule.lateInterest?.frequency,
          updatePeriods: {
            create: data.updateRule.updatePeriods.map((period) => ({
              date: new Date(period.date),
              type: period.type,
              value: period.value,
              indexName: period.indexName
            }))
          }
        }
      },
      guarantors: {
        create: data.guarantorIds.map((guarantorId) => ({
          guarantorId
        }))
      }
    },
    include: {
      updateRule: {
        include: {
          updatePeriods: true
        }
      },
      guarantors: true
    }
  })

  // Actualizar estado del departamento a "alquilado"
  await prisma.apartment.update({
    where: { id: data.apartmentId },
    data: { status: 'alquilado' }
  })

  // Crear entrada en historial de alquileres
  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId }
  })

  await prisma.rentalHistory.create({
    data: {
      apartmentId: data.apartmentId,
      contractId: contract.id,
      tenantId: data.tenantId,
      tenantName: tenant?.nameOrBusiness || '',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      initialAmount: data.initialAmount
    }
  })

  return await getById(contract.id, userId)
}

export const update = async (id: number, data: UpdateContractDto, userId: number) => {
  const contract = await getById(id, userId)
  if (!contract) {
    throw new Error('Contract not found or access denied')
  }
  
  return await prisma.contract.update({
    where: { id },
    data: {
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      initialAmount: data.initialAmount
    },
    include: {
      apartment: true,
      tenant: true,
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    }
  })
}

export const remove = async (id: number, userId: number) => {
  const contract = await getById(id, userId)

  if (!contract) {
    throw new Error('Contract not found or access denied')
  }

  // Eliminar del historial de alquileres
  await prisma.rentalHistory.deleteMany({
    where: { contractId: id }
  })

  // Eliminar contrato (cascade eliminará updateRule y períodos)
  await prisma.contract.delete({
    where: { id }
  })

  // Actualizar estado del departamento a "disponible"
  await prisma.apartment.update({
    where: { id: contract.apartmentId },
    data: { status: 'disponible' }
  })
}
