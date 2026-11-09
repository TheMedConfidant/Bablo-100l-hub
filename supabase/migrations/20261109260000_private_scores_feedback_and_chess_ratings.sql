-- Keep raw chess rating rows, feedback and detailed scores out of the public Data API.
begin;
create or replace function public.hub_chess_rating(p_token text,p_game_id uuid,p_dev text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_uid text;g public.chess_games%rowtype;r public.chess_ratings%rowtype;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return jsonb_build_object('ok',false,'error','Please log in again.'); end if;
 if coalesce(length(p_dev),0)<1 or length(p_dev)>64 then return jsonb_build_object('ok',false,'error','Invalid player reference.'); end if;
 select * into g from public.chess_games where id=p_game_id;
 if not found then return jsonb_build_object('ok',false,'error','Game not found.'); end if;
 if not coalesce((g.white_uid=v_uid or g.black_uid=v_uid
   or (g.white_uid is null and g.white_dev=p_dev)
   or (g.black_uid is null and g.black_dev=p_dev)),false)
   or p_dev not in (coalesce(g.white_dev,''),coalesce(g.black_dev,'')) then
  return jsonb_build_object('ok',false,'error','You cannot view ratings for this game.');
 end if;
 select * into r from public.chess_ratings where dev=p_dev;
 if not found then return jsonb_build_object('ok',true,'rating',1000,'wins',0,'draws',0,'losses',0); end if;
 return jsonb_build_object('ok',true,'rating',r.rating,'wins',r.wins,'draws',r.draws,'losses',r.losses,'nick',r.nick);
end $$;
revoke all on function public.hub_chess_rating(text,uuid,text) from public;
grant execute on function public.hub_chess_rating(text,uuid,text) to anon,authenticated;
revoke all on table public.chess_ratings from public,anon,authenticated;
drop policy if exists chess_ratings_read_all on public.chess_ratings;

revoke select on table public.feedback from public,anon,authenticated;
revoke all on table public.scores from public,anon,authenticated;
drop policy if exists "read scores" on public.scores;
commit;
