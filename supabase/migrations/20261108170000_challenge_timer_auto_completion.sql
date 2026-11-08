-- Close expired live challenges from the existing presence heartbeat.
-- This preserves completed players' scores and marks only unfinished seats abandoned.
create or replace function public.hub_challenge_presence(p_token text, p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor text;
  v_match public.hub_challenge_matches%rowtype;
  v_player_status text;
  v_capacity integer;
  v_active_count integer;
  v_host_seen timestamptz;
  v_next_host text;
  v_players jsonb;
  v_host_username text;
  v_player_count integer;
  v_ready_count integer;
begin
  v_actor := public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;

  select * into v_match from public.hub_challenge_matches where id = p_match_id for update;
  if not found then raise exception 'Challenge not found.'; end if;

  -- A timer expiry is authoritative even if every client disconnects before pressing Finish.
  if v_match.status = 'active'
     and coalesce(v_match.ends_at, v_match.starts_at + make_interval(secs => v_match.duration_seconds)) <= now() then
    update public.hub_challenge_players
      set status = 'abandoned', completed_at = coalesce(completed_at, now())
      where match_id = p_match_id and status not in ('completed','abandoned');
    update public.hub_challenge_matches
      set status = 'completed', completed_at = coalesce(completed_at, now())
      where id = p_match_id;
    select * into v_match from public.hub_challenge_matches where id = p_match_id;
  end if;

  select status into v_player_status from public.hub_challenge_players
    where match_id = p_match_id and player_uid = v_actor for update;
  if v_player_status is null then raise exception 'You are not a participant in this challenge.'; end if;
  v_capacity := greatest(2, least(8, coalesce((v_match.settings->>'max_players')::integer, 2)));

  if v_player_status = 'abandoned' and v_match.status = 'completed' then
    update public.hub_challenge_players set last_seen_at = now()
      where match_id = p_match_id and player_uid = v_actor;
  elsif v_player_status = 'abandoned' then
    if v_match.status in ('waiting','ready') then
      select count(*) into v_active_count from public.hub_challenge_players
        where match_id = p_match_id and status in ('joined','ready');
      if v_active_count >= v_capacity then
        raise exception 'This room has filled while you were away. Ask the host for a new invite.';
      end if;
    elsif v_match.status = 'active' then
      raise exception 'This match has ended.';
    else
      raise exception 'This challenge is no longer available.';
    end if;
    update public.hub_challenge_players set status = 'joined', last_seen_at = now()
      where match_id = p_match_id and player_uid = v_actor;
  elsif v_player_status in ('joined','ready','completed') then
    update public.hub_challenge_players set last_seen_at = now()
      where match_id = p_match_id and player_uid = v_actor;
  else
    raise exception 'This challenge is no longer available to you.';
  end if;

  if v_match.status in ('waiting','ready') then
    update public.hub_challenge_players set status = 'abandoned'
      where match_id = p_match_id and status in ('joined','ready')
        and player_uid <> v_actor and last_seen_at < now() - interval '5 minutes';
  end if;

  select last_seen_at into v_host_seen from public.hub_challenge_players
    where match_id = p_match_id and player_uid = v_match.created_by;
  if v_match.status in ('waiting','ready','active')
     and v_host_seen < now() - interval '60 seconds' then
    select player_uid into v_next_host from public.hub_challenge_players
      where match_id = p_match_id and player_uid <> v_match.created_by
        and status in ('joined','ready') and last_seen_at > now() - interval '25 seconds'
      order by joined_at, player_uid limit 1;
    if v_next_host = v_actor then
      update public.hub_challenge_matches set created_by = v_actor
        where id = p_match_id returning * into v_match;
    end if;
  end if;

  select last_seen_at into v_host_seen from public.hub_challenge_players
    where match_id = p_match_id and player_uid = v_match.created_by;
  select count(*) into v_player_count from public.hub_challenge_players
    where match_id = p_match_id and status in ('joined','ready');
  select count(*) into v_ready_count from public.hub_challenge_players
    where match_id = p_match_id and status = 'ready';
  select username into v_host_username from public.hub_accounts where unique_id = v_match.created_by;

  select coalesce(jsonb_agg(jsonb_build_object(
    'username', a.username, 'status', p.status, 'score', p.score,
    'online', p.last_seen_at > now() - interval '25 seconds',
    'is_host', p.player_uid = v_match.created_by
  ) order by p.joined_at), '[]'::jsonb)
  into v_players
  from public.hub_challenge_players p
  join public.hub_accounts a on a.unique_id = p.player_uid
  where p.match_id = p_match_id and p.status <> 'invited';

  return jsonb_build_object(
    'ok', true, 'players', v_players,
    'host_online', v_host_seen > now() - interval '25 seconds' or v_match.created_by = v_actor,
    'is_host', v_match.created_by = v_actor, 'host_username', v_host_username,
    'player_count', v_player_count, 'ready_count', v_ready_count,
    'max_players', v_capacity, 'match_status', v_match.status, 'server_time', now()
  );
end
$function$;

create or replace function public.hub_challenge_get_questions(p_token text, p_match_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_actor text;
  v_match public.hub_challenge_matches%rowtype;
  v_safe jsonb;
  v_creator text;
  v_ready_count integer;
  v_player_count integer;
  v_capacity integer;
  v_my_status text;
  v_my_answers jsonb;
  v_score integer;
  v_players jsonb;
begin
  v_actor := public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;
  select * into v_match from public.hub_challenge_matches where id = p_match_id;
  if not found or not exists(
    select 1 from public.hub_challenge_players
    where match_id = p_match_id and player_uid = v_actor
      and (status in ('joined','ready','completed') or (status = 'abandoned' and v_match.status = 'completed'))
  ) then
    raise exception 'You are not a participant in this challenge.';
  end if;
  v_capacity := greatest(2, least(8, coalesce((v_match.settings->>'max_players')::integer, 2)));
  select username into v_creator from public.hub_accounts where unique_id = v_match.created_by;
  select status, score into v_my_status, v_score from public.hub_challenge_players
    where match_id = p_match_id and player_uid = v_actor;
  select count(*) into v_ready_count from public.hub_challenge_players
    where match_id = p_match_id and status = 'ready';
  select count(*) into v_player_count from public.hub_challenge_players
    where match_id = p_match_id and status in ('joined','ready');
  select coalesce(jsonb_agg(jsonb_build_object('index', ord-1, 'prompt', q->'prompt',
    'choices', q->'choices', 'course', q->'course', 'topic', q->'topic') order by ord), '[]'::jsonb)
    into v_safe from jsonb_array_elements(v_match.question_set) with ordinality as x(q,ord);
  select coalesce(jsonb_object_agg(question_index::text, jsonb_build_object(
    'answer_key', answer_key, 'is_correct', is_correct, 'awarded_point', awarded_point)), '{}'::jsonb)
    into v_my_answers from public.hub_challenge_answers where match_id = p_match_id and player_uid = v_actor;
  select coalesce(jsonb_agg(jsonb_build_object('username', a.username, 'status', p.status, 'score', p.score)
    order by p.joined_at), '[]'::jsonb)
    into v_players from public.hub_challenge_players p
    join public.hub_accounts a on a.unique_id = p.player_uid
    where p.match_id = p_match_id and p.status <> 'invited';
  return jsonb_build_object('ok', true, 'match_id', v_match.id, 'invite_code', v_match.invite_code,
    'creator_username', v_creator, 'is_host', v_match.created_by = v_actor, 'mode', v_match.mode,
    'courses', v_match.courses, 'topics', v_match.topics, 'question_count', v_match.question_count,
    'duration_seconds', v_match.duration_seconds, 'status', v_match.status, 'starts_at', v_match.starts_at,
    'questions', v_safe, 'my_status', v_my_status, 'my_score', coalesce(v_score,0),
    'my_answers', v_my_answers, 'ready_count', v_ready_count, 'player_count', v_player_count,
    'max_players', v_capacity, 'players', v_players);
end
$function$;