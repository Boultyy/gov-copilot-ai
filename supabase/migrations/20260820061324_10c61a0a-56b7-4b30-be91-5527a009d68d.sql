-- Extend documents for full document intelligence
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS char_count INTEGER,
  ADD COLUMN IF NOT EXISTS word_count INTEGER,
  ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS analysis JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
UPDATE public.documents SET status = 'uploaded'
  WHERE status NOT IN ('uploaded','processing','extracting','indexing','analyzing','ready','failed','ocr_required');
ALTER TABLE public.documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('uploaded','processing','extracting','indexing','analyzing','ready','failed','ocr_required'));

-- Ensure ownership policies are explicit for both read and write
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
CREATE POLICY "Users can manage their own documents"
ON public.documents FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can view chunks of their own documents" ON public.document_chunks;
CREATE POLICY "Users can manage their own chunks"
ON public.document_chunks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_chunks TO authenticated;
GRANT ALL ON public.document_chunks TO service_role;

-- Storage policies (per-user folder ownership)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Scoped vector search (optionally limited to a single document)
CREATE OR REPLACE FUNCTION public.match_document_chunks_scoped(
  query_embedding extensions.vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, document_id uuid, content text, metadata jsonb,
  page_number int, chunk_index int, similarity float, document_name text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT dc.id, dc.document_id, dc.content, dc.metadata::jsonb, dc.page_number,
         (dc.metadata->>'chunk_index')::int AS chunk_index,
         1 - (dc.embedding <=> query_embedding) AS similarity,
         d.name AS document_name
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.user_id = p_user_id
    AND (p_document_id IS NULL OR d.id = p_document_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_document_chunks_scoped TO authenticated, service_role;