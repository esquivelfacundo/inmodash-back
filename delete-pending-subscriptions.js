const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deletePendingSubscriptions() {
  try {
    // Eliminar todas las suscripciones pendientes
    const result = await prisma.subscription.deleteMany({
      where: {
        status: 'pending'
      }
    });

    console.log(`✅ Deleted ${result.count} pending subscriptions`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deletePendingSubscriptions();
