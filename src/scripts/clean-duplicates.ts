import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDuplicateApartments() {
  console.log('🔍 Buscando departamentos duplicados...')
  
  try {
    // Obtener todos los departamentos
    const apartments = await prisma.apartment.findMany({
      orderBy: { id: 'asc' }
    })

    // Agrupar por uniqueId
    const grouped = apartments.reduce((acc: any, apt) => {
      if (!acc[apt.uniqueId]) {
        acc[apt.uniqueId] = []
      }
      acc[apt.uniqueId].push(apt)
      return acc
    }, {})

    // Encontrar duplicados
    const duplicates = Object.entries(grouped).filter(([_, apts]: any) => apts.length > 1)

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron duplicados')
      return
    }

    console.log(`⚠️ Se encontraron ${duplicates.length} uniqueIds duplicados`)

    // Eliminar duplicados (mantener el primero)
    for (const [uniqueId, apts] of duplicates as any) {
      console.log(`\n🔧 Limpiando uniqueId: ${uniqueId}`)
      console.log(`   Total de duplicados: ${apts.length}`)
      
      // Mantener el primero, eliminar el resto
      const toDelete = apts.slice(1)
      
      for (const apt of toDelete) {
        console.log(`   ❌ Eliminando apartamento ID: ${apt.id}`)
        await prisma.apartment.delete({
          where: { id: apt.id }
        })
      }
    }

    console.log('\n✅ Limpieza completada')
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
cleanDuplicateApartments()
  .then(() => {
    console.log('\n✨ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
