-- CreateTable
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mercadopagoSubscriptionId" VARCHAR(255),
    "mercadopagoCustomerId" VARCHAR(255),
    "mercadopagoPreapprovalId" VARCHAR(255),
    "plan" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'ARS',
    "billingDay" INTEGER,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "frequencyType" VARCHAR(20) NOT NULL DEFAULT 'months',
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextBillingDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentStatus" VARCHAR(50),
    "lastPaymentAmount" DOUBLE PRECISION,
    "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
    "trialEndDate" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subscription_payments" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "mercadopagoPaymentId" VARCHAR(255) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "statusDetail" VARCHAR(255),
    "paymentMethodId" VARCHAR(255),
    "paymentType" VARCHAR(50),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_mercadopagoSubscriptionId_key" ON "subscriptions"("mercadopagoSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_mercadopagoPreapprovalId_key" ON "subscriptions"("mercadopagoPreapprovalId");
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_mercadopagoSubscriptionId_idx" ON "subscriptions"("mercadopagoSubscriptionId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_payments_mercadopagoPaymentId_key" ON "subscription_payments"("mercadopagoPaymentId");
CREATE INDEX IF NOT EXISTS "subscription_payments_subscriptionId_idx" ON "subscription_payments"("subscriptionId");
CREATE INDEX IF NOT EXISTS "subscription_payments_mercadopagoPaymentId_idx" ON "subscription_payments"("mercadopagoPaymentId");
CREATE INDEX IF NOT EXISTS "subscription_payments_status_idx" ON "subscription_payments"("status");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_userId_fkey'
    ) THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscription_payments_subscriptionId_fkey'
    ) THEN
        ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
