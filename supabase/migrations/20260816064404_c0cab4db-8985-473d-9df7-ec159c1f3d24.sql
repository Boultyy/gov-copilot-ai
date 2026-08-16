-- RPC for vector search on document chunks
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  page_number int,
  similarity float,
  document_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata::jsonb,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.name as document_name
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.user_id = p_user_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

GRANT EXECUTE ON FUNCTION public.match_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_chunks TO service_role;
