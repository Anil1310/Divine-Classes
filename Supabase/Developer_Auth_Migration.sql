-- Remove legacy portal passwords from public settings and cached snapshots.
DROP POLICY IF EXISTS "Public full access" ON public.settings_config;
DROP POLICY IF EXISTS "Public noncredential settings access" ON public.settings_config;
CREATE POLICY "Public noncredential settings access" ON public.settings_config
    FOR ALL TO public, anon, authenticated
    USING (setting_parameter NOT IN (
        'Master Admin Password', 'Admin Password', 'Admin Login Password', 'admin_password',
        'Lead Developer Password', 'Lead Dev Password', 'LEAD_DEV_PASSWORD'
    ))
    WITH CHECK (setting_parameter NOT IN (
        'Master Admin Password', 'Admin Password', 'Admin Login Password', 'admin_password',
        'Lead Developer Password', 'Lead Dev Password', 'LEAD_DEV_PASSWORD'
    ));

DROP POLICY IF EXISTS "Public full access" ON public.db_json;
DROP POLICY IF EXISTS "Public credential-free snapshot access" ON public.db_json;
CREATE POLICY "Public credential-free snapshot access" ON public.db_json
    FOR ALL TO public, anon, authenticated
    USING (NOT (COALESCE(payload->'settings', '{}'::jsonb) ?| ARRAY[
        'adminPassword', 'admin_password', 'Master Admin Password', 'Admin Password',
        'leadDevPassword', 'LEAD_DEV_PASSWORD', 'Lead Developer Password', 'Lead Dev Password', 'devPassword'
    ]))
    WITH CHECK (NOT (COALESCE(payload->'settings', '{}'::jsonb) ?| ARRAY[
        'adminPassword', 'admin_password', 'Master Admin Password', 'Admin Password',
        'leadDevPassword', 'LEAD_DEV_PASSWORD', 'Lead Developer Password', 'Lead Dev Password', 'devPassword'
    ]));

DELETE FROM public.settings_config
WHERE setting_parameter IN (
    'Master Admin Password', 'Admin Password', 'Admin Login Password', 'admin_password',
    'Lead Developer Password', 'Lead Dev Password', 'LEAD_DEV_PASSWORD'
);

UPDATE public.db_json
SET payload = jsonb_set(
    payload,
    '{settings}',
    COALESCE(payload->'settings', '{}'::jsonb) - 'adminPassword' - 'admin_password' -
        'Master Admin Password' - 'Admin Password' - 'Lead Developer Password' -
        'leadDevPassword' - 'LEAD_DEV_PASSWORD' - 'devPassword',
    true
)
WHERE payload ? 'settings';
