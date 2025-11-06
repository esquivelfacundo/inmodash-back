import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

// Use Railway production database
process.env.DATABASE_URL = 'postgresql://postgres:qjMWLqLxjlPVQhfbIQvPVVHWdWNTdlZy@autorack.proxy.rlwy.net:18197/railway'

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    const password = 'Lidius@2001'
    const passwordHash = await argon2.hash(password)

    const users = [
      {
        email: 'test1@lidius.co',
        name: 'Test User 1',
        companyName: 'Test Company 1',
      },
      {
        email: 'test2@lidius.co',
        name: 'Test User 2',
        companyName: 'Test Company 2',
      },
      {
        email: 'test3@lidius.co',
        name: 'Test User 3',
        companyName: 'Test Company 3',
      },
      {
        email: 'test4@lidius.co',
        name: 'Test User 4',
        companyName: 'Test Company 4',
      },
    ]

    for (const userData of users) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existing) {
        console.log(`❌ User ${userData.email} already exists`)
        continue
      }

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          companyName: userData.companyName,
          role: 'user',
          isEmailVerified: false,
        },
      })

      console.log(`✅ Created user: ${user.email} (ID: ${user.id})`)
    }

    console.log('\n🎉 All test users created successfully!')
    console.log('Password for all users: Lidius@2001')
  } catch (error) {
    console.error('Error creating test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
