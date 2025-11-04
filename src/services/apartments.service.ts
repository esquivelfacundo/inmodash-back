import prisma from '../config/database'
import { recalculateApartmentPercentages } from '../utils/calculations'
import { CreateApartmentDto, UpdateApartmentDto } from '../types'

export const getAll = async () => {
  return await prisma.apartment.findMany({
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

export const getById = async (id: number) => {
  return await prisma.apartment.findUnique({
    where: { id },
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

export const getByBuildingId = async (buildingId: number) => {
  return await prisma.apartment.findMany({
    where: { buildingId },
    include: {
      rentalHistory: true
    },
    orderBy: [
      { floor: 'asc' },
      { apartmentLetter: 'asc' }
    ]
  })
}

export const create = async (data: CreateApartmentDto) => {
  console.log('Creating apartment with data:', JSON.stringify(data, null, 2))
  console.log('Specifications:', data.specifications)
  
  const apartment = await prisma.apartment.create({
    data: {
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

  return await getById(apartment.id)
}

export const update = async (id: number, data: UpdateApartmentDto) => {
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

  return await getById(apartment.id)
}

export const remove = async (id: number) => {
  const apartment = await prisma.apartment.findUnique({
    where: { id }
  })

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
