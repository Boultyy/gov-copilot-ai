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
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT dc.id, dc.document_id, dc.content, dc.metadata::jsonb, dc.page_number,
         (dc.metadata->>'chunk_index')::int AS chunk_index,
         1 - (dc.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity,
         d.name AS document_name
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE d.user_id = COALESCE(auth.uid(), p_user_id)
    AND (p_document_id IS NULL OR d.id = p_document_id)
    AND 1 - (dc.embedding OPERATOR(extensions.<=>) query_embedding) > match_threshold
  ORDER BY dc.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_document_chunks_scoped FROM anon;
GRANT EXECUTE ON FUNCTION public.match_document_chunks_scoped TO authenticated, service_role;