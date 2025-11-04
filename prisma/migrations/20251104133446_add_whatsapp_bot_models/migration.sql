-- AlterTable
ALTER TABLE "apartments" ADD COLUMN "rentalPrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "whatsapp_configs" (
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
CREATE TABLE "conversations" (
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
CREATE TABLE "messages" (
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
CREATE UNIQUE INDEX "whatsapp_configs_userId_key" ON "whatsapp_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_configs_phoneNumberId_key" ON "whatsapp_configs"("phoneNumberId");

-- CreateIndex
CREATE INDEX "whatsapp_configs_userId_idx" ON "whatsapp_configs"("userId");

-- CreateIndex
CREATE INDEX "whatsapp_configs_phoneNumberId_idx" ON "whatsapp_configs"("phoneNumberId");

-- CreateIndex
CREATE INDEX "conversations_configId_idx" ON "conversations"("configId");

-- CreateIndex
CREATE INDEX "conversations_phoneNumber_idx" ON "conversations"("phoneNumber");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_configId_phoneNumber_key" ON "conversations"("configId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "messages_messageId_key" ON "messages"("messageId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_messageId_idx" ON "messages"("messageId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- AddForeignKey
ALTER TABLE "whatsapp_configs" ADD CONSTRAINT "whatsapp_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_configId_fkey" FOREIGN KEY ("configId") REFERENCES "whatsapp_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
