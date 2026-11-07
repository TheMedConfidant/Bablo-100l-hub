-- Allow challenge hosts to start with the players currently present once everyone is ready.
-- Keep full-capacity auto-start behaviour for rooms that fill to their configured limit.

create or replace function public.hub_challenge_ready(p_token text, p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
 v_actor text; v_match public.hub_challenge_matches%rowtype; v_count integer; v_players integer; v_capacity integer;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;
 select * into v_match from public.hub_challenge_matches where id=p_match_id for update;
 if not found or v_match.status not in ('waiting','ready','active') then raise exception 'This match is not accepting ready status.'; end if;
 if not exists(select 1 from public.hub_challenge_players where match_id=p_match_id and player_uid=v_actor and status in ('joined','ready')) then
  raise exception 'You are not a participant in this match.';
 end if;
 if v_match.status='active' then return jsonb_build_object('ok',true,'status',v_match.status,'starts_at',v_match.starts_at); end if;
 v_capacity:=greatest(2,least(8,coalesce((v_match.settings->>'max_players')::integer,2)));
 update public.hub_challenge_players set status='ready' where match_id=p_match_id and player_uid=v_actor;
 select count(*) into v_count from public.hub_challenge_players where match_id=p_match_id and status='ready';
 select count(*) into v_players from public.hub_challenge_players where match_id=p_match_id and status in ('joined','ready');
 if v_count=v_players and v_players>=2 then
   if v_players>=v_capacity then
     update public.hub_challenge_matches set status='active',starts_at=coalesce(starts_at,now()+interval '5 seconds'),
       ends_at=coalesce(ends_at,now()+interval '5 seconds'+make_interval(secs=>duration_seconds))
     where id=p_match_id returning * into v_match;
   else
     update public.hub_challenge_matches set status='ready' where id=p_match_id returning * into v_match;
   end if;
 else
   update public.hub_challenge_matches set status=case when v_players>=v_capacity then 'ready' else 'waiting' end
   where id=p_match_id returning * into v_match;
 end if;
 return jsonb_build_object('ok',true,'status',v_match.status,'starts_at',v_match.starts_at,
   'ready_count',v_count,'player_count',v_players,'max_players',v_capacity);
end
$function$;

create or replace function public.hub_challenge_start_now(p_token text, p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor text;
  v_match public.hub_challenge_matches%rowtype;
  v_players integer;
  v_ready integer;
begin
  v_actor := public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;
  select * into v_match from public.hub_challenge_matches where id = p_match_id for update;
  if not found then raise exception 'Challenge not found.'; end if;
  if v_match.created_by <> v_actor then raise exception 'Only the room host can start the match early.'; end if;
  if v_match.status = 'active' then
    return jsonb_build_object('ok',true,'status','active','starts_at',v_match.starts_at);
  end if;
  if v_match.status not in ('waiting','ready') then raise exception 'This room can no longer be started.'; end if;
  select count(*) into v_players from public.hub_challenge_players
    where match_id=p_match_id and status in ('joined','ready');
  select count(*) into v_ready from public.hub_challenge_players
    where match_id=p_match_id and status='ready';
  if v_players < 2 then raise exception 'At least two players must join before the host can start.'; end if;
  if v_ready <> v_players then raise exception 'Everyone who has joined must press Ready first.'; end if;
  update public.hub_challenge_matches
    set status='active',
        starts_at=coalesce(starts_at,now()+interval '5 seconds'),
        ends_at=coalesce(ends_at,now()+interval '5 seconds'+make_interval(secs=>duration_seconds))
    where id=p_match_id returning * into v_match;
  insert into public.hub_challenge_notifications(recipient_uid,actor_uid,kind,title,body,target_id)
    select player_uid,v_actor,'challenge_started','Challenge starting',
      'The host started the room with the players currently present.',p_match_id::text
    from public.hub_challenge_players
    where match_id=p_match_id and player_uid<>v_actor and status='ready';
  return jsonb_build_object('ok',true,'status',v_match.status,'starts_at',v_match.starts_at,
    'ready_count',v_ready,'player_count',v_players,
    'max_players',greatest(2,least(8,coalesce((v_match.settings->>'max_players')::integer,2))));
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
  v_actor:=public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;
  select * into v_match from public.hub_challenge_matches where id=p_match_id;
  if not found or not exists(select 1 from public.hub_challenge_players
    where match_id=p_match_id and player_uid=v_actor and status in ('joined','ready','completed')) then
    raise exception 'You are not a participant in this challenge.';
  end if;
  v_capacity:=greatest(2,least(8,coalesce((v_match.settings->>'max_players')::integer,2)));
  select username into v_creator from public.hub_accounts where unique_id=v_match.created_by;
  select status,score into v_my_status,v_score from public.hub_challenge_players
    where match_id=p_match_id and player_uid=v_actor;
  select count(*) into v_ready_count from public.hub_challenge_players
    where match_id=p_match_id and status='ready';
  select count(*) into v_player_count from public.hub_challenge_players
    where match_id=p_match_id and status in ('joined','ready');
  select coalesce(jsonb_agg(jsonb_build_object('index',ord-1,'prompt',q->'prompt',
    'choices',q->'choices','course',q->'course','topic',q->'topic') order by ord),'[]'::jsonb)
    into v_safe from jsonb_array_elements(v_match.question_set) with ordinality as x(q,ord);
  select coalesce(jsonb_object_agg(question_index::text,jsonb_build_object(
    'answer_key',answer_key,'is_correct',is_correct,'awarded_point',awarded_point)),'{}'::jsonb)
    into v_my_answers from public.hub_challenge_answers where match_id=p_match_id and player_uid=v_actor;
  select coalesce(jsonb_agg(jsonb_build_object('username',a.username,'status',p.status,'score',p.score)
    order by p.joined_at),'[]'::jsonb)
    into v_players from public.hub_challenge_players p
    join public.hub_accounts a on a.unique_id=p.player_uid
    where p.match_id=p_match_id and p.status<>'invited';
  return jsonb_build_object('ok',true,'match_id',v_match.id,'invite_code',v_match.invite_code,
    'creator_username',v_creator,'is_host',v_match.created_by=v_actor,'mode',v_match.mode,
    'courses',v_match.courses,'topics',v_match.topics,'question_count',v_match.question_count,
    'duration_seconds',v_match.duration_seconds,'status',v_match.status,'starts_at',v_match.starts_at,
    'questions',v_safe,'my_status',v_my_status,'my_score',coalesce(v_score,0),
    'my_answers',v_my_answers,'ready_count',v_ready_count,'player_count',v_player_count,
    'max_players',v_capacity,'players',v_players);
end
$function$;
