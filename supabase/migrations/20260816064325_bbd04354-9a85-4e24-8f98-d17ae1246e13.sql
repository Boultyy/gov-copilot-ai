-- 1. Update Documents Table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.documents ALTER COLUMN status SET DEFAULT 'uploaded';

-- Clean up status if it has invalid values
UPDATE public.documents SET status = 'uploaded' WHERE status NOT IN ('uploaded', 'processing', 'ready', 'failed');

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_status_check CHECK (status IN ('uploaded', 'processing', 'ready', 'failed'));

-- 2. Update Document Chunks Table
ALTER TABLE public.document_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER;
ALTER TABLE public.document_chunks ADD COLUMN IF NOT EXISTS section_title TEXT;
-- Ensure embedding is the correct size for text-embedding-3-small (1536)
ALTER TABLE public.document_chunks ALTER COLUMN embedding TYPE extensions.vector(1536);

-- 3. RLS for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Using a simpler approach without DO blocks if they cause issues
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
CREATE POLICY "Users can manage their own documents"
ON public.documents
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

-- 4. RLS for Document Chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view chunks of their own documents" ON public.document_chunks;
CREATE POLICY "Users can view chunks of their own documents"
ON public.document_chunks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.documents
        WHERE documents.id = document_chunks.document_id
        AND documents.user_id = auth.uid()
    )
);

GRANT ALL ON public.document_chunks TO authenticated;
GRANT ALL ON public.document_chunks TO service_role;

-- 5. RLS for Storage (objects table in storage schema)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON public.document_chunks 
USING hnsw (embedding extensions.vector_cosine_ops);

CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON public.document_chunks(document_id);
