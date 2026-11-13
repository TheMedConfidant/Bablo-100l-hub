create or replace function public.hub_qualifier_leaderboard()
returns json
language sql
stable
security definer
set search_path to 'public'
as $function$
  with ranked as (
    select
      q.programme,
      q.nickname,
      q.pct,
      q.secs,
      row_number() over (
        partition by lower(coalesce(nullif(trim(q.programme), ''), 'unknown programme'))
        order by q.pct desc, q.secs asc, q.created_at asc, q.uid asc
      ) as programme_rank
    from public.qualifier_results q
    where q.season = '2026-11'
  )
  select coalesce(
    json_agg(
      json_build_object(
        'programme', programme,
        'nickname', nickname,
        'pct', pct,
        'secs', secs
      )
      order by programme, programme_rank
    ),
    '[]'::json
  )
  from ranked
  where programme_rank <= 3;
$function$;
