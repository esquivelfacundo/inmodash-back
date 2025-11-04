-- AlterTable
ALTER TABLE "apartments" ADD COLUMN "userId" INTEGER;

-- Update existing apartments to have a userId (assign to first user if any exists)
UPDATE "apartments" 
SET "userId" = (SELECT id FROM "users" ORDER BY id LIMIT 1)
WHERE "userId" IS NULL;

-- Make userId NOT NULL after updating existing records
ALTER TABLE "apartments" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "apartments_userId_idx" ON "apartments"("userId");

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (increase column sizes)
ALTER TABLE "apartments" ALTER COLUMN "uniqueId" TYPE VARCHAR(100);
ALTER TABLE "apartments" ALTER COLUMN "apartmentLetter" TYPE VARCHAR(20);
ALTER TABLE "apartments" ALTER COLUMN "nomenclature" TYPE VARCHAR(50);
