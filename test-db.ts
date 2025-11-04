import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    
    // Test básico de conexión
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');
    
    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`👥 Total de usuarios en la base: ${userCount}`);
    
    // Buscar el usuario específico
    const user = await prisma.user.findUnique({
      where: { email: 'facundoesquivel01@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isEmailVerified: true,
        createdAt: true
      }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Nombre:', user.name);
      console.log('   Rol:', user.role);
      console.log('   Email verificado:', user.isEmailVerified);
      console.log('   Password hash (primeros 20 chars):', user.passwordHash.substring(0, 20) + '...');
      console.log('   Creado:', user.createdAt);
    } else {
      console.log('❌ Usuario no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
