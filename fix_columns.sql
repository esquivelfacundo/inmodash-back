-- Fix all column length issues in apartments table
-- This SQL will be executed directly in Railway database

-- Increase column sizes to prevent "column too long" errors
ALTER TABLE "apartments" ALTER COLUMN "uniqueId" TYPE VARCHAR(100);
ALTER TABLE "apartments" ALTER COLUMN "apartmentLetter" TYPE VARCHAR(20);
ALTER TABLE "apartments" ALTER COLUMN "nomenclature" TYPE VARCHAR(100);

-- Ensure specifications column can handle large JSON
ALTER TABLE "apartments" ALTER COLUMN "specifications" TYPE TEXT;

-- Add userId column if it doesn't exist (for future multi-tenancy)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'apartments' AND column_name = 'userId') THEN
        ALTER TABLE "apartments" ADD COLUMN "userId" INTEGER;
        
        -- Update existing apartments to have a userId (assign to first user if any exists)
        UPDATE "apartments" 
        SET "userId" = (SELECT id FROM "users" ORDER BY id LIMIT 1)
        WHERE "userId" IS NULL;
        
        -- Create index on userId
        CREATE INDEX IF NOT EXISTS "apartments_userId_idx" ON "apartments"("userId");
        
        -- Add foreign key constraint
        ALTER TABLE "apartments" ADD CONSTRAINT "apartments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
