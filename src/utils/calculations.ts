/**
 * Calcula el porcentaje de área de un departamento respecto al total del edificio
 */
export function calculateAreaPercentage(apartmentArea: number, totalBuildingArea: number): number {
  if (totalBuildingArea === 0) return 0
  return Math.round((apartmentArea / totalBuildingArea) * 100 * 100) / 100
}

/**
 * Calcula el porcentaje de ambientes de un departamento respecto al total del edificio
 */
export function calculateRoomPercentage(apartmentRooms: number, totalBuildingRooms: number): number {
  if (totalBuildingRooms === 0) return 0
  return Math.round((apartmentRooms / totalBuildingRooms) * 100 * 100) / 100
}

/**
 * Recalcula los porcentajes de todos los departamentos de un edificio
 */
export async function recalculateApartmentPercentages(prisma: any, buildingId: number) {
  const apartments = await prisma.apartment.findMany({
    where: { buildingId }
  })

  const building = await prisma.building.findUnique({
    where: { id: buildingId }
  })

  if (!building) return

  const totalRooms = apartments.reduce((sum: number, apt: any) => sum + apt.rooms, 0)

  for (const apartment of apartments) {
    await prisma.apartment.update({
      where: { id: apartment.id },
      data: {
        areaPercentage: calculateAreaPercentage(apartment.area, building.totalArea),
        roomPercentage: calculateRoomPercentage(apartment.rooms, totalRooms)
      }
    })
  }
}
