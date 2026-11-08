-- Bablo Hub: configurable 2–8 player public challenge rooms.
-- Captured from the verified live function definitions after applying this change.
CREATE OR REPLACE FUNCTION public.hub_challenge_accept(p_token text, p_match_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_actor text; v_match public.hub_challenge_matches%rowtype; v_count integer; v_capacity integer;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;
 select * into v_match from public.hub_challenge_matches where id=p_match_id for update;
 if not found then raise exception 'Challenge not found.'; end if;
 if v_match.status<>'waiting' then raise exception 'This challenge is no longer accepting players.'; end if;
 if v_match.invited_uid is not null and v_match.invited_uid<>v_actor then raise exception 'This challenge is private.'; end if;
 if v_actor=v_match.created_by then raise exception 'You cannot accept your own challenge.'; end if;
 if exists(select 1 from public.hub_user_blocks where (blocker_uid=v_actor and blocked_uid=v_match.created_by) or (blocker_uid=v_match.created_by and blocked_uid=v_actor)) then raise exception 'This challenge is unavailable.'; end if;
 v_capacity:=greatest(2,least(8,coalesce((v_match.settings->>'max_players')::integer,2)));
 if not exists(select 1 from public.hub_challenge_players where match_id=p_match_id and player_uid=v_actor and status in ('joined','ready')) then
  select count(*) into v_count from public.hub_challenge_players where match_id=p_match_id and status in ('joined','ready');
  if v_count>=v_capacity then raise exception 'This room is full.'; end if;
 end if;
 insert into public.hub_challenge_players(match_id,player_uid,status) values(p_match_id,v_actor,'joined')
 on conflict(match_id,player_uid) do update set status='joined';
 select count(*) into v_count from public.hub_challenge_players where match_id=p_match_id and status in ('joined','ready');
 update public.hub_challenge_matches set status=case when v_count>=v_capacity then 'ready' else 'waiting' end,starts_at=null,ends_at=null
 where id=p_match_id returning * into v_match;
 insert into public.hub_challenge_notifications(recipient_uid,actor_uid,kind,title,body,target_id)
 values(v_match.created_by,v_actor,'challenge_accepted','Player joined your challenge','A student joined your room. The match starts when every player is ready.',p_match_id::text);
 return jsonb_build_object('ok',true,'match_id',p_match_id,'status',v_match.status,'ready_count',0,'player_count',v_count,'max_players',v_capacity);
end $function$


CREATE OR REPLACE FUNCTION public.hub_challenge_create(p_token text, p_mode text, p_courses text[], p_topics jsonb, p_question_count integer, p_duration_seconds integer, p_question_set jsonb, p_invited_username text DEFAULT NULL::text, p_leaderboard_opt_in boolean DEFAULT false, p_max_players integer DEFAULT 2)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_actor text; v_invited text; v_match public.hub_challenge_matches%rowtype; v_q jsonb; v_capacity integer;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;
 if p_mode not in ('quick_duel','multi_course','course_clash','topic_battle','survival','marathon','random','rematch') then raise exception 'Invalid challenge mode.'; end if;
 if coalesce(cardinality(p_courses),0) not between 1 and 12 then raise exception 'Choose between 1 and 12 courses.'; end if;
 if p_question_count not between 5 and 100 then raise exception 'Choose 5 to 100 questions.'; end if;
 if p_duration_seconds not between 60 and 7200 then raise exception 'Choose a duration between 1 minute and 2 hours.'; end if;
 if p_max_players not between 2 and 8 then raise exception 'Choose between 2 and 8 players.'; end if;
 if p_invited_username is not null and length(trim(p_invited_username))>0 and p_max_players<>2 then raise exception 'Private username invitations are currently 1-vs-1. Create a public room for a group challenge.'; end if;
 if jsonb_typeof(p_question_set)<>'array' or jsonb_array_length(p_question_set)<>p_question_count then raise exception 'The question set does not match the selected question count.'; end if;
 for v_q in select value from jsonb_array_elements(p_question_set) loop
  if coalesce(length(v_q->>'prompt'),0)<1 or jsonb_typeof(v_q->'choices')<>'array' or coalesce(length(v_q->>'answer_key'),0)<1 then
   raise exception 'A question is missing its prompt, choices, or answer key.';
  end if;
 end loop;
 if p_invited_username is not null and length(trim(p_invited_username))>0 then
  select unique_id into v_invited from public.hub_accounts where lower(username)=lower(trim(p_invited_username)) and coalesce(is_guest,false)=false limit 1;
  if v_invited is null then raise exception 'We could not find that username.'; end if;
  if v_invited=v_actor then raise exception 'You cannot challenge yourself.'; end if;
  if not exists(select 1 from public.hub_friendships where user_a=least(v_actor,v_invited) and user_b=greatest(v_actor,v_invited)) then raise exception 'Add this person as a friend before sending a private challenge.'; end if;
  if exists(select 1 from public.hub_user_blocks where (blocker_uid=v_actor and blocked_uid=v_invited) or (blocker_uid=v_invited and blocked_uid=v_actor)) then raise exception 'This challenge is unavailable.'; end if;
 end if;
 v_capacity:=case when v_invited is null then p_max_players else 2 end;
 insert into public.hub_challenge_matches(created_by,invited_uid,mode,courses,topics,question_count,duration_seconds,question_set,visibility,settings)
 values(v_actor,v_invited,p_mode,p_courses,coalesce(p_topics,'[]'::jsonb),p_question_count,p_duration_seconds,p_question_set,
   case when v_invited is null then 'public' else 'private' end,
   jsonb_build_object('leaderboard_opt_in',coalesce(p_leaderboard_opt_in,false),'max_players',v_capacity))
 returning * into v_match;
 insert into public.hub_challenge_players(match_id,player_uid,status,opted_into_leaderboard)
 values(v_match.id,v_actor,'joined',coalesce(p_leaderboard_opt_in,false));
 if v_invited is not null then
  insert into public.hub_challenge_players(match_id,player_uid,status) values(v_match.id,v_invited,'invited');
  insert into public.hub_challenge_notifications(recipient_uid,actor_uid,kind,title,body,target_id)
  values(v_invited,v_actor,'challenge_invite','Challenge invitation','A friend challenged you to a quiz.',v_match.id::text);
 end if;
 return jsonb_build_object('ok',true,'id',v_match.id,'match_id',v_match.id,'invite_code',v_match.invite_code,'status',v_match.status,'max_players',v_capacity);
end $function$


CREATE OR REPLACE FUNCTION public.hub_challenge_get_questions(p_token text, p_match_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_actor text; v_match public.hub_challenge_matches%rowtype; v_safe jsonb; v_creator text; v_ready_count integer; v_player_count integer; v_capacity integer; v_my_status text; v_my_answers jsonb; v_score integer; v_players jsonb;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;
 select * into v_match from public.hub_challenge_matches where id=p_match_id;
 if not found or not exists(select 1 from public.hub_challenge_players where match_id=p_match_id and player_uid=v_actor and status in ('joined','ready','completed')) then
  raise exception 'You are not a participant in this challenge.';
 end if;
 v_capacity:=greatest(2,least(8,coalesce((v_match.settings->>'max_players')::integer,2)));
 select username into v_creator from public.hub_accounts where unique_id=v_match.created_by;
 select status,score into v_my_status,v_score from public.hub_challenge_players where match_id=p_match_id and player_uid=v_actor;
 select count(*) into v_ready_count from public.hub_challenge_players where match_id=p_match_id and status='ready';
 select count(*) into v_player_count from public.hub_challenge_players where match_id=p_match_id and status in ('joined','ready','completed','abandoned');
 select coalesce(jsonb_agg(jsonb_build_object('index',ord-1,'prompt',q->'prompt','choices',q->'choices','course',q->'course','topic',q->'topic') order by ord),'[]'::jsonb)
 into v_safe from jsonb_array_elements(v_match.question_set) with ordinality as x(q,ord);
 select coalesce(jsonb_object_agg(question_index::text,jsonb_build_object('answer_key',answer_key,'is_correct',is_correct,'awarded_point',awarded_point)),'{}'::jsonb)
 into v_my_answers from public.hub_challenge_answers where match_id=p_match_id and player_uid=v_actor;
 select coalesce(jsonb_agg(jsonb_build_object('username',a.username,'status',p.status,'score',p.score) order by p.joined_at),'[]'::jsonb)
 into v_players from public.hub_challenge_players p join public.hub_accounts a on a.unique_id=p.player_uid
 where p.match_id=p_match_id and p.status<>'invited';
 return jsonb_build_object('ok',true,'match_id',v_match.id,'invite_code',v_match.invite_code,'creator_username',v_creator,
  'mode',v_match.mode,'courses',v_match.courses,'topics',v_match.topics,'question_count',v_match.question_count,
  'duration_seconds',v_match.duration_seconds,'status',v_match.status,'starts_at',v_match.starts_at,'questions',v_safe,
  'my_status',v_my_status,'my_score',coalesce(v_score,0),'my_answers',v_my_answers,'ready_count',v_ready_count,
  'player_count',v_player_count,'max_players',v_capacity,'players',v_players);
end $function$


CREATE OR REPLACE FUNCTION public.hub_challenge_ready(p_token text, p_match_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_actor text; v_match public.hub_challenge_matches%rowtype; v_count integer; v_players integer; v_capacity integer;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;
 select * into v_match from public.hub_challenge_matches where id=p_match_id for update;
 if not found or v_match.status not in ('ready','active') then raise exception 'This match is not in its ready lobby.'; end if;
 if not exists(select 1 from public.hub_challenge_players where match_id=p_match_id and player_uid=v_actor and status in ('joined','ready')) then
  raise exception 'You are not a participant in this match.';
 end if;
 if v_match.status='active' then return jsonb_build_object('ok',true,'status',v_match.status,'starts_at',v_match.starts_at); end if;
 v_capacity:=greatest(2,least(8,coalesce((v_match.settings->>'max_players')::integer,2)));
 update public.hub_challenge_players set status='ready' where match_id=p_match_id and player_uid=v_actor;
 select count(*) into v_count from public.hub_challenge_players where match_id=p_match_id and status='ready';
 select count(*) into v_players from public.hub_challenge_players where match_id=p_match_id and status in ('joined','ready');
 if v_count>=v_capacity and v_players>=v_capacity then
  update public.hub_challenge_matches set status='active',starts_at=coalesce(starts_at,now()+interval '5 seconds'),
   ends_at=coalesce(ends_at,now()+interval '5 seconds'+make_interval(secs=>duration_seconds))
  where id=p_match_id returning * into v_match;
 else
  select * into v_match from public.hub_challenge_matches where id=p_match_id;
 end if;
 return jsonb_build_object('ok',true,'status',v_match.status,'starts_at',v_match.starts_at,'ready_count',v_count,'player_count',v_players,'max_players',v_capacity);
end $function$

