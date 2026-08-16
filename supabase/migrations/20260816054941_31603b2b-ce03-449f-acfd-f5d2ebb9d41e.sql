-- Move extensions to the extensions schema to satisfy linter
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension if it's in public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector' AND (SELECT nspname FROM pg_namespace WHERE oid = extnamespace) = 'public') THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END $$;
