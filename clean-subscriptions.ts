import { PrismaClient } from '@prisma/client'

// Use Railway production database
process.env.DATABASE_URL = 'postgresql://postgres:qjMWLqLxjlPVQhfbIQvPVVHWdWNTdlZy@autorack.proxy.rlwy.net:18197/railway'

const prisma = new PrismaClient()

async function cleanSubscriptions() {
  try {
    console.log('🧹 Cleaning all subscriptions...')

    // Delete all subscription payments first (foreign key constraint)
    const deletedPayments = await prisma.subscriptionPayment.deleteMany({})
    console.log(`✅ Deleted ${deletedPayments.count} subscription payments`)

    // Delete all subscriptions
    const deletedSubscriptions = await prisma.subscription.deleteMany({})
    console.log(`✅ Deleted ${deletedSubscriptions.count} subscriptions`)

    // Reset user subscription status
    const updatedUsers = await prisma.user.updateMany({
      data: {
        subscriptionStatus: null,
        subscriptionPlan: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        lastPaymentDate: null,
        nextPaymentDate: null,
      },
    })
    console.log(`✅ Reset subscription status for ${updatedUsers.count} users`)

    console.log('\n🎉 All subscriptions cleaned successfully!')
    console.log('You can now create new subscriptions.')
  } catch (error) {
    console.error('❌ Error cleaning subscriptions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanSubscriptions()
