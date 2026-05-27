-- Create Postcard table for Astro DB integration

CREATE TABLE IF NOT EXISTS "Postcard" (
  id SERIAL PRIMARY KEY,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  date DATE NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "marginBottom" INTEGER,
  "marginRight" INTEGER,
  rotation DOUBLE PRECISION,
  "penColor" TEXT,
  "paperColor" TEXT,
  "fontSizeFactor" DOUBLE PRECISION,
  "lineHeight" DOUBLE PRECISION,
  "authorLeftOffset" DOUBLE PRECISION,
  "authorTopOffset" DOUBLE PRECISION,
  "authorRotation" DOUBLE PRECISION,
  "dateLeftOffset" DOUBLE PRECISION,
  "dateTopOffset" DOUBLE PRECISION,
  "dateRotation" DOUBLE PRECISION,
  "bodyLeftOffset" DOUBLE PRECISION,
  "bodyTopOffset" DOUBLE PRECISION,
  "bodyRotation" DOUBLE PRECISION,
  "stampSvg" TEXT,
  country TEXT,
  province TEXT,
  "websiteUrl" TEXT,
  "postOfficeStampTop" DOUBLE PRECISION,
  "postOfficeStampRight" DOUBLE PRECISION,
  "postOfficeStampRotation" DOUBLE PRECISION,
  "wavyStampTop" DOUBLE PRECISION,
  "wavyStampRight" DOUBLE PRECISION,
  "wavyStampRotation" DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_postcard_is_published ON "Postcard"("isPublished");
CREATE INDEX IF NOT EXISTS idx_postcard_date ON "Postcard"(date DESC);
CREATE INDEX IF NOT EXISTS idx_postcard_country ON "Postcard"(country);
CREATE INDEX IF NOT EXISTS idx_postcard_province ON "Postcard"(province);

-- Create a trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_postcard_updated_at ON "Postcard";
CREATE TRIGGER update_postcard_updated_at
  BEFORE UPDATE ON "Postcard"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE "Postcard" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read published postcards
DROP POLICY IF EXISTS "Allow read access to published postcards" ON "Postcard";
CREATE POLICY "Allow read access to published postcards"
  ON "Postcard"
  FOR SELECT
  USING ("isPublished" = true);

-- Create policy to allow anyone to insert postcards
DROP POLICY IF EXISTS "Allow insert access for postcards" ON "Postcard";
CREATE POLICY "Allow insert access for postcards"
  ON "Postcard"
  FOR INSERT
  WITH CHECK (true);
