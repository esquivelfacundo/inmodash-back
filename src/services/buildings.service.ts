import prisma from '../config/database'
import { generateApartments } from '../utils/generators'
import { CreateBuildingDto, UpdateBuildingDto } from '../types'

export const getAll = async (userId: number) => {
  return await prisma.building.findMany({
    where: { userId },
    include: {
      apartments: true,
      floorConfig: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.building.findFirst({
    where: { id, userId },
    include: {
      apartments: {
        orderBy: [
          { floor: 'asc' },
          { apartmentLetter: 'asc' }
        ]
      },
      floorConfig: true
    }
  })
}

export const create = async (data: CreateBuildingDto, userId: number) => {
  // Crear edificio con configuración de pisos
  const building = await prisma.building.create({
    data: {
      userId,
      name: data.name,
      address: data.address,
      city: data.city,
      province: data.province,
      owner: data.owner,
      floors: data.floors,
      totalArea: data.totalArea,
      floorConfig: {
        create: data.floorConfiguration
      }
    },
    include: {
      floorConfig: true
    }
  })
  
  // Generar departamentos automáticamente con userId
  const apartments = generateApartments(building, building.floorConfig, userId)
  
  await prisma.apartment.createMany({
    data: apartments
  })
  
  return await getById(building.id, userId)
}

export const update = async (id: number, data: UpdateBuildingDto, userId: number) => {
  // Verificar que el edificio pertenece al usuario
  const building = await getById(id, userId)
  if (!building) {
    throw new Error('Building not found or access denied')
  }
  
  return await prisma.building.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      province: data.province,
      owner: data.owner,
      floors: data.floors,
      totalArea: data.totalArea
    },
    include: {
      apartments: true,
      floorConfig: true
    }
  })
}

export const remove = async (id: number, userId: number) => {
  // Verificar que el edificio pertenece al usuario
  const building = await getById(id, userId)
  if (!building) {
    throw new Error('Building not found or access denied')
  }
  
  // Prisma eliminará automáticamente los apartments por CASCADE
  return await prisma.building.delete({
    where: { id }
  })
}
