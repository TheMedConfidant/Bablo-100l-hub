-- Bind leaderboard score submissions to the authenticated Bablo session.
begin;

create or replace function public.hub_submit_scores(p_token text, p_scores jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  acc public.hub_accounts%rowtype;
  item jsonb;
  inserted_count integer := 0;
  v_dev text;
  v_course text;
  v_mode text;
  v_n integer;
  v_correct integer;
  v_secs integer;
  v_ts bigint;
begin
  select a.* into acc
  from public.hub_sessions s
  join public.hub_accounts a on a.unique_id = s.unique_id
  where s.token = p_token and s.expires_at > now()
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Please log in again.');
  end if;
  if jsonb_typeof(p_scores) <> 'array' or jsonb_array_length(p_scores) > 100 then
    return jsonb_build_object('ok', false, 'error', 'Invalid score batch.');
  end if;

  for item in select value from jsonb_array_elements(p_scores)
  loop
    v_dev := left(coalesce(item->>'dev',''),64);
    v_course := upper(left(coalesce(item->>'course',''),16));
    v_mode := coalesce(item->>'mode','');
    v_n := greatest(0,coalesce((item->>'n')::integer,0));
    v_correct := greatest(0,coalesce((item->>'correct')::integer,0));
    v_secs := greatest(0,coalesce((item->>'secs')::integer,0));
    v_ts := coalesce((item->>'ts')::bigint,0);

    if v_dev = '' or v_course !~ '^[A-Z0-9]{2,16}$'
       or v_mode not in ('quiz','exam')
       or v_n < 10 or v_n > 500
       or v_correct > v_n
       or v_secs < v_n * 3 or v_secs > 86400
       or v_ts < (extract(epoch from now() - interval '30 days') * 1000)::bigint
       or v_ts > (extract(epoch from now() + interval '5 minutes') * 1000)::bigint then
      continue;
    end if;

    if not exists (
      select 1 from public.scores s
      where s.uid = acc.unique_id and s.dev = v_dev
        and s.ts = v_ts and s.course = v_course and s.mode = v_mode
    ) then
      insert into public.scores(dev,nick,course,mode,n,correct,pct,secs,ts,programme,uid)
      values(v_dev,left(acc.nickname,30),v_course,v_mode,v_n,v_correct,
        round((v_correct::numeric / v_n::numeric) * 100,1),
        v_secs,v_ts,acc.programme,acc.unique_id);
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  return jsonb_build_object('ok',true,'inserted',inserted_count);
exception when others then
  return jsonb_build_object('ok',false,'error','Could not save scores.');
end;
$$;

revoke insert, update, delete on public.scores from anon, authenticated;
drop policy if exists "add scores with account" on public.scores;
grant select on public.scores to anon, authenticated;
grant execute on function public.hub_submit_scores(text,jsonb) to anon, authenticated;

commit;
