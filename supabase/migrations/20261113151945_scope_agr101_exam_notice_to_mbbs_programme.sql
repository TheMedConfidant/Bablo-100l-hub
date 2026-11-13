update public.hub_public_exam_schedule
set programme = 'MBBS',
    updated_at = now()
where id = 'test-agr101-2026'
  and institution_slug = 'bowen-university'
  and academic_level = '100L'
  and programme is distinct from 'MBBS';
