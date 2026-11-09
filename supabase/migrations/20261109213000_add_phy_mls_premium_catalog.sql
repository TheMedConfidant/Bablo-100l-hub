-- Add the PHY 101 and MLS 101 resource packs that are already present in the published study library.
insert into public.hub_premium_catalog(course_code,resource_type,amount_kobo,is_active)
values
 ('PHY','notes',50000,true),
 ('PHY','flashcards',50000,true),
 ('MLS101','notes',50000,true),
 ('MLS101','flashcards',50000,true)
on conflict(course_code,resource_type)
do update set amount_kobo=excluded.amount_kobo,is_active=true,updated_at=now();
