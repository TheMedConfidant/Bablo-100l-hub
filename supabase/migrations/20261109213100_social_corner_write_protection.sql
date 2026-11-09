-- Protect Social Corner authorship and stop clients forging posts, comments or likes.
begin;
alter table public.social_posts add column if not exists author_uid text references public.hub_accounts(unique_id) on delete set null;
alter table public.social_comments add column if not exists author_uid text references public.hub_accounts(unique_id) on delete set null;
delete from public.social_likes a using public.social_likes b where a.post_id=b.post_id and a.dev=b.dev and a.id>b.id;
create unique index if not exists social_likes_post_dev_uidx on public.social_likes(post_id,dev);
create index if not exists social_posts_author_uid_idx on public.social_posts(author_uid,created_at desc);
create index if not exists social_comments_author_uid_idx on public.social_comments(author_uid,created_at desc);
revoke insert,update,delete,truncate,references,trigger on public.social_posts,public.social_comments,public.social_likes from public,anon,authenticated;
grant select on public.social_posts,public.social_comments,public.social_likes to anon,authenticated;

create or replace function public.hub_social_post(p_token text,p_body text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid text;v_nick text;v_programme text;v_id uuid;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return jsonb_build_object('ok',false,'error','Please sign in to post.'); end if;
 select nickname,programme into v_nick,v_programme from public.hub_accounts where unique_id=v_uid and is_guest=false;
 if not found then return jsonb_build_object('ok',false,'error','A registered account is required.'); end if;
 if length(trim(coalesce(p_body,''))) not between 2 and 500 then return jsonb_build_object('ok',false,'error','Post must be 2–500 characters.'); end if;
 insert into public.social_posts(author_uid,nick,programme,body) values(v_uid,left(v_nick,30),v_programme,trim(p_body)) returning id into v_id;
 return jsonb_build_object('ok',true,'id',v_id);
end; $$;
revoke all on function public.hub_social_post(text,text) from public;
grant execute on function public.hub_social_post(text,text) to anon,authenticated;

create or replace function public.hub_social_comment(p_token text,p_post_id uuid,p_body text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid text;v_nick text;v_programme text;v_id bigint;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return jsonb_build_object('ok',false,'error','Please sign in to comment.'); end if;
 select nickname,programme into v_nick,v_programme from public.hub_accounts where unique_id=v_uid and is_guest=false;
 if not found then return jsonb_build_object('ok',false,'error','A registered account is required.'); end if;
 if length(trim(coalesce(p_body,''))) not between 1 and 300 then return jsonb_build_object('ok',false,'error','Comment must be 1–300 characters.'); end if;
 if not exists(select 1 from public.social_posts where id=p_post_id) then return jsonb_build_object('ok',false,'error','Post not found.'); end if;
 insert into public.social_comments(author_uid,post_id,nick,programme,body)
 values(v_uid,p_post_id,left(v_nick,30),v_programme,trim(p_body)) returning id into v_id;
 return jsonb_build_object('ok',true,'id',v_id);
end; $$;
revoke all on function public.hub_social_comment(text,uuid,text) from public;
grant execute on function public.hub_social_comment(text,uuid,text) to anon,authenticated;

create or replace function public.hub_social_like(p_token text,p_post_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid text;v_inserted integer;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return jsonb_build_object('ok',false,'error','Please sign in to like a post.'); end if;
 if not exists(select 1 from public.hub_accounts where unique_id=v_uid and is_guest=false) then return jsonb_build_object('ok',false,'error','A registered account is required.'); end if;
 if not exists(select 1 from public.social_posts where id=p_post_id) then return jsonb_build_object('ok',false,'error','Post not found.'); end if;
 insert into public.social_likes(post_id,dev) values(p_post_id,v_uid) on conflict(post_id,dev) do nothing;
 get diagnostics v_inserted=row_count;
 return jsonb_build_object('ok',true,'liked',true,'already_liked',v_inserted=0);
end; $$;
revoke all on function public.hub_social_like(text,uuid) from public;
grant execute on function public.hub_social_like(text,uuid) to anon,authenticated;

-- Quiz answer telemetry is optional; stop arbitrary clients forging its aggregate.
revoke insert,update,delete,truncate,references,trigger on public.question_answers from public,anon,authenticated;
commit;
