import prisma from '../config/database'
import { recalculateApartmentPercentages } from '../utils/calculations'
import { CreateApartmentDto, UpdateApartmentDto } from '../types'

export const getAll = async (userId: number) => {
  return await prisma.apartment.findMany({
    where: {
      userId: userId
    },
    include: {
      building: true,
      owner: true,
      rentalHistory: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.apartment.findFirst({
    where: {
      id,
      userId: userId
    },
    include: {
      building: true,
      owner: true,
      contracts: {
        include: {
          tenant: true,
          updateRule: {
            include: {
              updatePeriods: true
            }
          }
        }
      },
      rentalHistory: {
        orderBy: {
          startDate: 'desc'
        }
      }
    }
  })
}

export const getByBuildingId = async (buildingId: number, userId: number) => {
  return await prisma.apartment.findMany({
    where: {
      buildingId,
      building: {
        userId: userId
      }
    },
    include: {
      rentalHistory: true
    },
    orderBy: [
      { floor: 'asc' },
      { apartmentLetter: 'asc' }
    ]
  })
}

export const create = async (data: CreateApartmentDto, userId: number) => {
  console.log('Creating apartment with data:', JSON.stringify(data, null, 2))
  console.log('Specifications:', data.specifications)
  
  const apartment = await prisma.apartment.create({
    data: {
      userId: userId,
      uniqueId: data.uniqueId,
      // Campos de edificio (opcionales)
      buildingId: data.buildingId,
      floor: data.floor,
      apartmentLetter: data.apartmentLetter,
      nomenclature: data.nomenclature,
      // Campos independientes (opcionales)
      fullAddress: data.fullAddress,
      city: data.city,
      province: data.province,
      // Propietario
      ownerId: data.ownerId,
      // Tipo de propiedad
      propertyType: data.propertyType || 'departamento',
      // Información general
      area: data.area || 0,
      rooms: data.rooms || 0,
      status: data.status || 'disponible',
      saleStatus: data.saleStatus || 'no_esta_en_venta',
      // Especificaciones
      specifications: data.specifications
    }
  })

  // Recalcular porcentajes del edificio solo si pertenece a uno
  if (apartment.buildingId) {
    await recalculateApartmentPercentages(prisma, apartment.buildingId)
  }

  return await getById(apartment.id, userId)
}

export const update = async (id: number, data: UpdateApartmentDto, userId: number) => {
  // First verify the apartment belongs to the user
  const existingApartment = await getById(id, userId)
  if (!existingApartment) {
    throw new Error('Apartment not found or access denied')
  }

  const apartment = await prisma.apartment.update({
    where: { id },
    data: {
      // Campos de edificio
      floor: data.floor,
      apartmentLetter: data.apartmentLetter,
      nomenclature: data.nomenclature,
      // Campos independientes
      fullAddress: data.fullAddress,
      city: data.city,
      province: data.province,
      // Propietario
      ownerId: data.ownerId,
      // Tipo de propiedad
      propertyType: data.propertyType,
      // Información general
      area: data.area,
      rooms: data.rooms,
      status: data.status,
      saleStatus: data.saleStatus,
      // Especificaciones
      specifications: data.specifications
    }
  })

  // Recalcular porcentajes si cambió área o rooms y pertenece a un edificio
  if ((data.area !== undefined || data.rooms !== undefined) && apartment.buildingId) {
    await recalculateApartmentPercentages(prisma, apartment.buildingId)
  }

  return await getById(apartment.id, userId)
}

export const remove = async (id: number, userId: number) => {
  // First verify the apartment belongs to the user
  const apartment = await getById(id, userId)

  if (!apartment) {
    throw new Error('Apartment not found')
  }

  await prisma.apartment.delete({
    where: { id }
  })

  // Recalcular porcentajes del edificio solo si pertenece a uno
  if (apartment.buildingId) {
    await recalculateApartmentPercentages(prisma, apartment.buildingId)
  }
}
