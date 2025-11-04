// Script simple para limpiar duplicados en la base de datos
// Ejecutar con: node clean-db.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Iniciando limpieza de duplicados...\n')
  
  try {
    // Obtener todos los departamentos
    const apartments = await prisma.apartment.findMany({
      orderBy: { id: 'asc' }
    })

    console.log(`📊 Total de departamentos: ${apartments.length}`)

    // Agrupar por uniqueId
    const grouped = {}
    apartments.forEach(apt => {
      if (!grouped[apt.uniqueId]) {
        grouped[apt.uniqueId] = []
      }
      grouped[apt.uniqueId].push(apt)
    })

    // Encontrar duplicados
    const duplicates = Object.entries(grouped).filter(([_, apts]) => apts.length > 1)

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron duplicados\n')
      return
    }

    console.log(`\n⚠️ Se encontraron ${duplicates.length} uniqueIds duplicados\n`)

    let totalDeleted = 0

    // Eliminar duplicados (mantener el primero)
    for (const [uniqueId, apts] of duplicates) {
      console.log(`🔧 Limpiando: ${uniqueId}`)
      console.log(`   Duplicados: ${apts.length}`)
      
      // Mantener el primero, eliminar el resto
      const toDelete = apts.slice(1)
      
      for (const apt of toDelete) {
        await prisma.apartment.delete({
          where: { id: apt.id }
        })
        totalDeleted++
        console.log(`   ❌ Eliminado ID: ${apt.id}`)
      }
    }

    console.log(`\n✅ Limpieza completada`)
    console.log(`📊 Total eliminados: ${totalDeleted}`)
    console.log(`📊 Total restantes: ${apartments.length - totalDeleted}\n`)
    
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('✨ Script finalizado exitosamente\n')
    process.exit(0)
  })
  .catch(async (error) => {
    await prisma.$disconnect()
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
