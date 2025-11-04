import { Router } from 'express'
import prisma from '../config/database'

const router = Router()

// Fix foreign key constraint to allow cascade delete
router.post('/fix-building-cascade', async (req, res) => {
  try {
    console.log('🔄 Fixing foreign key constraints...')
    
    // Fix apartments -> buildings constraint
    await prisma.$executeRaw`
      ALTER TABLE "apartments" DROP CONSTRAINT IF EXISTS "apartments_buildingId_fkey";
    `
    
    await prisma.$executeRaw`
      ALTER TABLE "apartments" 
      ADD CONSTRAINT "apartments_buildingId_fkey" 
      FOREIGN KEY ("buildingId") 
      REFERENCES "buildings"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `
    
    // Fix contracts -> apartments constraint
    await prisma.$executeRaw`
      ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_apartmentId_fkey";
    `
    
    await prisma.$executeRaw`
      ALTER TABLE "contracts" 
      ADD CONSTRAINT "contracts_apartmentId_fkey" 
      FOREIGN KEY ("apartmentId") 
      REFERENCES "apartments"("id") 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `
    
    console.log('✅ All foreign key constraints updated successfully')
    
    res.json({
      success: true,
      message: 'Cascade delete enabled for buildings, apartments and contracts'
    })
  } catch (error) {
    console.error('❌ Fix failed:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Fix apartments without userId by assigning them to their building's owner
router.post('/fix-apartment-userids', async (req, res) => {
  try {
    console.log('🔄 Starting apartment userId fix...')
    
    // Get all apartments without userId that belong to a building
    const apartmentsWithoutUserId = await prisma.apartment.findMany({
      where: {
        userId: null,
        buildingId: { not: null }
      },
      include: {
        building: true
      }
    })
    
    console.log(`Found ${apartmentsWithoutUserId.length} apartments without userId`)
    
    // Update each apartment with its building's userId
    let updated = 0
    for (const apartment of apartmentsWithoutUserId) {
      if (apartment.building && apartment.building.userId) {
        await prisma.apartment.update({
          where: { id: apartment.id },
          data: { userId: apartment.building.userId }
        })
        updated++
      }
    }
    
    console.log(`✅ Updated ${updated} apartments with userId`)
    
    res.json({
      success: true,
      message: `Fixed ${updated} apartments`,
      details: {
        found: apartmentsWithoutUserId.length,
        updated: updated
      }
    })
  } catch (error) {
    console.error('❌ Fix failed:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// TEMPORARY: Migration endpoint to fix column sizes
router.post('/fix-columns', async (req, res) => {
  try {
    console.log('🔄 Starting database migration...')
    
    // Execute raw SQL to fix column sizes and add userId
    await prisma.$executeRaw`
      -- Increase column sizes to prevent "column too long" errors
      ALTER TABLE "apartments" ALTER COLUMN "uniqueId" TYPE VARCHAR(100);
    `
    
    await prisma.$executeRaw`
      ALTER TABLE "apartments" ALTER COLUMN "apartmentLetter" TYPE VARCHAR(20);
    `
    
    await prisma.$executeRaw`
      ALTER TABLE "apartments" ALTER COLUMN "nomenclature" TYPE VARCHAR(100);
    `
    
    await prisma.$executeRaw`
      -- Ensure specifications column can handle large JSON
      ALTER TABLE "apartments" ALTER COLUMN "specifications" TYPE TEXT;
    `
    
    // Check if userId column exists, if not add it
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'apartments' AND column_name = 'userId'
    ` as any[]
    
    if (result.length === 0) {
      console.log('Adding userId column...')
      await prisma.$executeRaw`
        ALTER TABLE "apartments" ADD COLUMN "userId" INTEGER;
      `
      
      // Update existing apartments to have a userId (assign to first user if any exists)
      await prisma.$executeRaw`
        UPDATE "apartments" 
        SET "userId" = (SELECT id FROM "users" ORDER BY id LIMIT 1)
        WHERE "userId" IS NULL;
      `
      
      // Create index on userId
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "apartments_userId_idx" ON "apartments"("userId");
      `
      
      // Add foreign key constraint
      await prisma.$executeRaw`
        ALTER TABLE "apartments" ADD CONSTRAINT "apartments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `
    }
    
    console.log('✅ Database migration completed successfully')
    res.json({ 
      success: true, 
      message: 'Database migration completed successfully',
      userIdColumnExists: result.length > 0
    })
  } catch (error) {
    console.error('❌ Migration failed:', error)
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

export default router
