INSERT INTO app.permissions (name, guard_name, owner, description) 
VALUES ('view-data-dictionary', 'web', 'EDM', 'Akses viewing untuk Data Dictionary') 
ON CONFLICT (name) DO NOTHING;

INSERT INTO app.role_has_permissions (permission_id, role_id)
SELECT p.id, r.id FROM app.permissions p, app.roles r
WHERE p.name = 'view-data-dictionary' AND r.name = 'super-admin'
ON CONFLICT DO NOTHING;
