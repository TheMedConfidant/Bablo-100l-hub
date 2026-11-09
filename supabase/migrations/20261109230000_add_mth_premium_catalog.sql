-- MTH 101 notes and dedicated Anki-style flashcards are published.
-- Store ₦500 per resource pack (50,000 kobo).
insert into public.hub_premium_catalog(course_code,resource_type,amount_kobo,is_active)
values ('MTH101','notes',50000,true),('MTH101','flashcards',50000,true)
on conflict(course_code,resource_type)
do update set amount_kobo=excluded.amount_kobo,is_active=true,updated_at=now();
