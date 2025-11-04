import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'facundoesquivel01@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  El usuario ya existe. Eliminando para recrear...');
      await prisma.user.delete({
        where: { email: 'facundoesquivel01@gmail.com' }
      });
      console.log('✅ Usuario anterior eliminado');
    }

    // Hashear la contraseña con argon2
    const passwordHash = await argon2.hash('Lidius@2001');
    console.log('🔐 Contraseña hasheada correctamente');

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email: 'facundoesquivel01@gmail.com',
        passwordHash,
        name: 'Facundo Esquivel',
        role: 'admin',
        isEmailVerified: true,
        subscriptionStatus: 'active',
        subscriptionPlan: 'professional',
        subscriptionStartDate: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      }
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.name);
    console.log('   Rol:', user.role);
    console.log('   Estado de suscripción:', user.subscriptionStatus);
    
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
