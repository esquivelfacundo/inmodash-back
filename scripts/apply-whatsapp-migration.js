/**
 * Script to manually apply WhatsApp migration to production database
 * Executes SQL commands one by one to avoid prepared statement errors
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Starting WhatsApp migration...');

  try {
    // Check if tables already exist
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('whatsapp_configs', 'conversations', 'messages')
    `;

    if (existingTables.length === 3) {
      console.log('✅ WhatsApp tables already exist. Skipping migration.');
      return;
    }

    console.log(`📊 Found ${existingTables.length}/3 tables. Proceeding with migration...`);
    console.log('📝 Creating WhatsApp tables...');

    // Execute each SQL statement separately
    
    // 1. Add rentalPrice column to apartments
    await prisma.$executeRaw`ALTER TABLE "apartments" ADD COLUMN IF NOT EXISTS "rentalPrice" DOUBLE PRECISION`;
    console.log('✓ Added rentalPrice column');

    // 2. Create whatsapp_configs table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "whatsapp_configs" (
          "id" SERIAL NOT NULL,
          "userId" INTEGER NOT NULL,
          "wabaId" VARCHAR(255) NOT NULL,
          "phoneNumberId" VARCHAR(255) NOT NULL,
          "accessToken" TEXT NOT NULL,
          "verifyToken" VARCHAR(255) NOT NULL,
          "botName" VARCHAR(100) NOT NULL DEFAULT 'Martina',
          "companyName" VARCHAR(255) NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "whatsapp_configs_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✓ Created whatsapp_configs table');

    // 3. Create conversations table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "conversations" (
          "id" SERIAL NOT NULL,
          "configId" INTEGER NOT NULL,
          "phoneNumber" VARCHAR(50) NOT NULL,
          "customerName" VARCHAR(255),
          "state" VARCHAR(50) NOT NULL DEFAULT 'initial',
          "context" TEXT NOT NULL DEFAULT '{}',
          "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✓ Created conversations table');

    // 4. Create messages table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "messages" (
          "id" SERIAL NOT NULL,
          "conversationId" INTEGER NOT NULL,
          "direction" VARCHAR(20) NOT NULL,
          "content" TEXT NOT NULL,
          "messageId" VARCHAR(255),
          "extractedData" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✓ Created messages table');

    // 5. Create indexes for whatsapp_configs
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_configs_userId_key" ON "whatsapp_configs"("userId")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_configs_phoneNumberId_key" ON "whatsapp_configs"("phoneNumberId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "whatsapp_configs_userId_idx" ON "whatsapp_configs"("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "whatsapp_configs_phoneNumberId_idx" ON "whatsapp_configs"("phoneNumberId")`;
    console.log('✓ Created indexes for whatsapp_configs');

    // 6. Create indexes for conversations
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "conversations_configId_idx" ON "conversations"("configId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "conversations_phoneNumber_idx" ON "conversations"("phoneNumber")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "conversations_configId_phoneNumber_key" ON "conversations"("configId", "phoneNumber")`;
    console.log('✓ Created indexes for conversations');

    // 7. Create indexes for messages
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "messages_messageId_key" ON "messages"("messageId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages"("conversationId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "messages_messageId_idx" ON "messages"("messageId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt")`;
    console.log('✓ Created indexes for messages');

    // 8. Add foreign keys
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_configs_userId_fkey'
        ) THEN
          ALTER TABLE "whatsapp_configs" ADD CONSTRAINT "whatsapp_configs_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;
    console.log('✓ Added foreign key for whatsapp_configs');

    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'conversations_configId_fkey'
        ) THEN
          ALTER TABLE "conversations" ADD CONSTRAINT "conversations_configId_fkey" 
          FOREIGN KEY ("configId") REFERENCES "whatsapp_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;
    console.log('✓ Added foreign key for conversations');

    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversationId_fkey'
        ) THEN
          ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" 
          FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;
    console.log('✓ Added foreign key for messages');

    console.log('✅ WhatsApp migration completed successfully!');
    console.log('📊 Tables created: whatsapp_configs, conversations, messages');
    console.log('📊 Column added: apartments.rentalPrice');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('Stack:', error.stack);
    // Don't throw - let the server start anyway
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('🎉 Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error.message);
    process.exit(0); // Exit with 0 so server can start
  });
