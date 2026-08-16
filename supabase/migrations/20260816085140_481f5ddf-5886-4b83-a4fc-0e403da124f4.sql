create or replace function public.get_scheme_counts_by_status()
returns table (status text, count bigint)
language sql
security definer
set search_path = public
as $$
  select verification_status::text as status, count(*) as count
  from public.schemes
  group by verification_status;
$$;

create or replace function public.get_scheme_counts_by_level()
returns table (level text, count bigint)
language sql
security definer
set search_path = public
as $$
  select government_level::text as level, count(*) as count
  from public.schemes
  group by government_level;
$$;

create or replace function public.get_scheme_counts_by_category()
returns table (category text, count bigint)
language sql
security definer
set search_path = public
as $$
  select category, count(*) as count
  from public.schemes
  where category is not null
  group by category;
$$;

grant execute on function public.get_scheme_counts_by_status() to authenticated;
grant execute on function public.get_scheme_counts_by_level() to authenticated;
grant execute on function public.get_scheme_counts_by_category() to authenticated;