-- Trigger functions are invoked by their triggers; clients must not have direct EXECUTE.
do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prorettype='trigger'::regtype
  loop
    execute format('revoke execute on function %I.%I(%s) from public, anon, authenticated',
      r.nspname,r.proname,r.args);
  end loop;
end $$;
