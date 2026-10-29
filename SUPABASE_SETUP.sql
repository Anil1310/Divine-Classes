-- ============================================================================
-- Divine Classes — Supabase Configuration SQL
-- Run this in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- Project: https://mbplsboknjvmhfqasuik.supabase.co
-- ============================================================================

-- 1. Enable full access for the Portal Web App across all institute tables
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offline_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedbacks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS external_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;

-- 2. Ensure initial settings exist
INSERT INTO settings (id, data) VALUES (
  1,
  '{
    "instituteName": "Divine Classes",
    "tagline": "Empowering Aspirants for JEE, NEET & Board Excellence",
    "address": "235 Paschimpuri Pocket 2, Club Rd New Delhi 110063",
    "phone": "+91 95556 78753",
    "email": "contact@divineclasses.in",
    "adminName": "Er. Rajesh Chahar",
    "adminEmail": "divineclasses1010@gmail.com",
    "showDummyData": true,
    "dummyDataConfig": {
      "students": true, "teachers": true, "batches": true,
      "offlineTests": true, "materials": true, "gallery": true, "feedbacks": true
    }
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

SELECT 'Divine Classes Supabase access configured successfully!' as status;
