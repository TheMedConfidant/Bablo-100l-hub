-- Keep uploaded study materials private at the Storage layer.
-- Approved public-library downloads are served through hub-download, which
-- checks uploads.status='approved' and issues short-lived signed URLs.
begin;
update storage.buckets set public=false where id='hub-uploads';
drop policy if exists "read hub-uploads" on storage.objects;
commit;
