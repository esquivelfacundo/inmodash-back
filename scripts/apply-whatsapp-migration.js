/**
 * Script to manually apply WhatsApp migration to production database
 * Run this once to create the WhatsApp tables
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

    if (existingTables.length > 0) {
      console.log('⚠️  WhatsApp tables already exist. Skipping migration.');
      console.log('Existing tables:', existingTables.map(t => t.table_name));
      return;
    }

    console.log('📝 Creating WhatsApp tables...');

    // Apply the migration SQL
    await prisma.$executeRawUnsafe(`
      -- AlterTable
      ALTER TABLE "apartments" ADD COLUMN IF NOT EXISTS "rentalPrice" DOUBLE PRECISION;

      -- CreateTable
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
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "whatsapp_configs_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable
      CREATE TABLE IF NOT EXISTS "conversations" (
          "id" SERIAL NOT NULL,
          "configId" INTEGER NOT NULL,
          "phoneNumber" VARCHAR(50) NOT NULL,
          "customerName" VARCHAR(255),
          "state" VARCHAR(50) NOT NULL DEFAULT 'initial',
          "context" TEXT NOT NULL DEFAULT '{}',
          "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable
      CREATE TABLE IF NOT EXISTS "messages" (
          "id" SERIAL NOT NULL,
          "conversationId" INTEGER NOT NULL,
          "direction" VARCHAR(20) NOT NULL,
          "content" TEXT NOT NULL,
          "messageId" VARCHAR(255),
          "extractedData" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
      );

      -- CreateIndex
      CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_configs_userId_key" ON "whatsapp_configs"("userId");
      CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_configs_phoneNumberId_key" ON "whatsapp_configs"("phoneNumberId");
      CREATE INDEX IF NOT EXISTS "whatsapp_configs_userId_idx" ON "whatsapp_configs"("userId");
      CREATE INDEX IF NOT EXISTS "whatsapp_configs_phoneNumberId_idx" ON "whatsapp_configs"("phoneNumberId");

      CREATE INDEX IF NOT EXISTS "conversations_configId_idx" ON "conversations"("configId");
      CREATE INDEX IF NOT EXISTS "conversations_phoneNumber_idx" ON "conversations"("phoneNumber");
      CREATE INDEX IF NOT EXISTS "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");
      CREATE UNIQUE INDEX IF NOT EXISTS "conversations_configId_phoneNumber_key" ON "conversations"("configId", "phoneNumber");

      CREATE UNIQUE INDEX IF NOT EXISTS "messages_messageId_key" ON "messages"("messageId");
      CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages"("conversationId");
      CREATE INDEX IF NOT EXISTS "messages_messageId_idx" ON "messages"("messageId");
      CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");

      -- AddForeignKey
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_configs_userId_fkey'
        ) THEN
          ALTER TABLE "whatsapp_configs" ADD CONSTRAINT "whatsapp_configs_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;

      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'conversations_configId_fkey'
        ) THEN
          ALTER TABLE "conversations" ADD CONSTRAINT "conversations_configId_fkey" 
          FOREIGN KEY ("configId") REFERENCES "whatsapp_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;

      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversationId_fkey'
        ) THEN
          ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" 
          FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✅ WhatsApp migration completed successfully!');
    console.log('📊 Tables created: whatsapp_configs, conversations, messages');
    console.log('📊 Column added: apartments.rentalPrice');

    // Mark migration as applied
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        '20251104133446_add_whatsapp_bot_models',
        NOW(),
        '20251104133446_add_whatsapp_bot_models',
        NULL,
        NULL,
        NOW(),
        1
      )
      ON CONFLICT DO NOTHING;
    `;

    console.log('✅ Migration marked as applied in _prisma_migrations table');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
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
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
