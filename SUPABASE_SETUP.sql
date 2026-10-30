-- ============================================================================
-- Divine Classes — Supabase Configuration SQL
-- Run this in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- Project: https://srjqsofkjizwskqnzyfn.supabase.co
-- ============================================================================

-- 1. Primary state store. Only the Apps Script backend uses the service-role key.
CREATE TABLE IF NOT EXISTS public.portal_state (
  state_id text PRIMARY KEY CHECK (state_id = 'primary'),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.portal_state FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.portal_state TO service_role;

CREATE TABLE IF NOT EXISTS public.portal_attendance (
  month_id text PRIMARY KEY CHECK (month_id ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  records jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(records) = 'array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.portal_attendance FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.portal_attendance TO service_role;

-- Restore row-level security if an earlier setup disabled it on legacy tables.
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.students FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.batches FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.teachers ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.teachers FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.materials ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.materials FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.offline_tests ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.offline_tests FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.test_marks ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.test_marks FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.gallery ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.gallery FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.feedbacks ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.feedbacks FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.external_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.external_links FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.notifications FROM anon, authenticated, PUBLIC;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.settings FROM anon, authenticated, PUBLIC;

-- 2. Ensure initial settings exist in the legacy settings table if it is still used.
INSERT INTO settings (id, data) VALUES (
  1,
  '{
    "instituteName": "Divine Classes",
    "tagline": "Empowering Aspirants for JEE, NEET & Board Excellence",
    "address": "235 Paschimpuri Pocket 2, Club Rd New Delhi 110063",
    "phone": "+91 95556 78753", 
    "email": "contact@divineclasses.in",
    "adminName": "Ravi Shankar",
    "adminEmail": "divineclasses1010@gmail.com",
    "showDummyData": true,
    "dummyDataConfig": {
      "students": true, "teachers": true, "batches": true,
      "offlineTests": true, "materials": true, "gallery": true, "feedbacks": true
    }
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = now();

SELECT 'Divine Classes Supabase access configured successfully!' as status;

