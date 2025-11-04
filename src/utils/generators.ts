/**
 * Genera el ID único del departamento
 * Formato: BuildingCode + Floor + Letter + Rooms + Sequence
 * Ejemplo: N13C100001
 */
export function generateApartmentId(
  buildingName: string,
  floor: number,
  apartmentLetter: string,
  rooms: number,
  sequence: number
): string {
  const buildingCode = buildingName
    .replace(/\s+/g, '')
    .substring(0, 2)
    .toUpperCase()
  
  const sequenceFormatted = sequence.toString().padStart(5, '0')
  
  return `${buildingCode}${floor}${apartmentLetter.toUpperCase()}${rooms}${sequenceFormatted}`
}

/**
 * Genera los departamentos automáticamente basado en la configuración de pisos
 */
export function generateApartments(building: any, floorConfig: any[], userId?: number) {
  const apartments: any[] = []
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  // Usar timestamp para garantizar unicidad
  const timestamp = Date.now()
  let sequence = 1

  floorConfig.forEach((config) => {
    for (let i = 0; i < config.apartmentsCount; i++) {
      const letter = letters[i]
      // Combinar timestamp con sequence para garantizar unicidad
      const uniqueSequence = timestamp + sequence
      const uniqueId = generateApartmentId(
        building.name,
        config.floor,
        letter,
        0, // rooms default
        uniqueSequence
      )

      const apartment: any = {
        uniqueId,
        buildingId: building.id,
        floor: config.floor,
        apartmentLetter: letter,
        nomenclature: `${config.floor}${letter}`,
        area: 0,
        rooms: 0,
        areaPercentage: 0,
        roomPercentage: 0,
        status: 'disponible',
        saleStatus: 'no_esta_en_venta'
      }

      // Add userId if provided
      if (userId) {
        apartment.userId = userId
      }

      apartments.push(apartment)
      sequence++
    }
  })

  return apartments
}
