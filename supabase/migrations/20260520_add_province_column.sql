-- Add province column to Postcard table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Postcard' AND column_name = 'province'
    ) THEN
        ALTER TABLE "Postcard" ADD COLUMN province TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_postcard_province ON "Postcard"(province);
