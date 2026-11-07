create or replace function public.hub_save_progress(p_token text, p_progress jsonb)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  uid text;
  existing_progress jsonb;
  incoming_devices jsonb;
  existing_devices jsonb;
  merged_devices jsonb := '{}'::jsonb;
  device_entry record;
  old_device_stats jsonb;
  new_device_stats jsonb;
  merged_device_stats jsonb;
  q_entry record;
  old_pair jsonb;
  new_pair jsonb;
  old_attempts integer;
  old_correct integer;
  new_attempts integer;
  new_correct integer;
begin
  update public.hub_sessions
     set expires_at = now() + interval '30 days'
   where token = p_token
     and expires_at > now()
  returning unique_id into uid;

  if uid is null then
    return json_build_object('ok', false, 'error', 'Please log in again.');
  end if;

  select coalesce(progress, '{}'::jsonb)
    into existing_progress
    from public.hub_accounts
   where unique_id = uid
   for update;

  incoming_devices := case when jsonb_typeof(p_progress->'statsByDevice') = 'object'
    then p_progress->'statsByDevice' else '{}'::jsonb end;
  existing_devices := case when jsonb_typeof(existing_progress->'statsByDevice') = 'object'
    then existing_progress->'statsByDevice' else '{}'::jsonb end;

  for device_entry in
    select key, value from jsonb_each(existing_devices || incoming_devices)
  loop
    old_device_stats := coalesce(existing_devices->device_entry.key, '{}'::jsonb);
    new_device_stats := coalesce(incoming_devices->device_entry.key, '{}'::jsonb);
    merged_device_stats := old_device_stats;

    for q_entry in select key, value from jsonb_each(new_device_stats)
    loop
      old_pair := old_device_stats->q_entry.key;
      new_pair := q_entry.value;
      if jsonb_typeof(new_pair) = 'array' and jsonb_array_length(new_pair) >= 2 then
        if jsonb_typeof(old_pair) = 'array' and jsonb_array_length(old_pair) >= 2 then
          old_attempts := greatest(0, coalesce((old_pair->>0)::integer, 0));
          old_correct := greatest(0, coalesce((old_pair->>1)::integer, 0));
        else
          old_attempts := 0;
          old_correct := 0;
        end if;
        new_attempts := greatest(0, coalesce((new_pair->>0)::integer, 0));
        new_correct := greatest(0, coalesce((new_pair->>1)::integer, 0));
        merged_device_stats := jsonb_set(merged_device_stats, array[q_entry.key],
          jsonb_build_array(greatest(old_attempts, new_attempts), greatest(old_correct, new_correct)), true);
      end if;
    end loop;
    merged_devices := jsonb_set(merged_devices, array[device_entry.key], merged_device_stats, true);
  end loop;

  update public.hub_accounts
     set progress = (coalesce(p_progress, '{}'::jsonb) - 'statsByDevice')
                    || jsonb_build_object('statsByDevice', merged_devices),
         updated_at = now()
   where unique_id = uid;

  return json_build_object('ok', true);
end
$function$;