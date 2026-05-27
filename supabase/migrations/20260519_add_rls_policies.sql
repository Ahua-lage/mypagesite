-- Add Row Level Security policies for Postcard table

-- Enable Row Level Security if not already enabled
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
