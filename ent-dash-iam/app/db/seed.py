import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.user import User, Position, OrganizationUnit
from app.models.role_permission import Role, Permission, RoleHasPermission, ModelHasRole
from app.core.security import get_password_hash


async def seed_data(db: AsyncSession):
    # 1. Seed Positions
    positions_data = [
        {"name": "Direktur", "level": 1},
        {"name": "SEVP", "level": 2},
        {"name": "VP", "level": 3},
        {"name": "AVP", "level": 4},
        {"name": "Officer", "level": 5},
    ]

    positions = {}
    for pos_in in positions_data:
        q = select(Position).where(Position.name == pos_in["name"])
        result = await db.execute(q)
        pos = result.scalars().first()
        if not pos:
            pos = Position(name=pos_in["name"], level=pos_in["level"])
            db.add(pos)
            await db.flush()
        positions[pos_in["name"]] = pos

    # 2. Seed Organization Units
    q = select(OrganizationUnit).where(OrganizationUnit.pluck_code == "DIR_TI")
    result = await db.execute(q)
    dir_ti = result.scalars().first()
    if not dir_ti:
        dir_ti = OrganizationUnit(pluck_code="DIR_TI", name="Direktorat TI", type="directorate")
        db.add(dir_ti)
        await db.flush()

    q = select(OrganizationUnit).where(OrganizationUnit.pluck_code == "SEVP_TI")
    result = await db.execute(q)
    sevp_ti = result.scalars().first()
    if not sevp_ti:
        sevp_ti = OrganizationUnit(pluck_code="SEVP_TI", name="SEVP TI", type="sevp", parent_id=dir_ti.id)
        db.add(sevp_ti)
        await db.flush()

    units = [
        {"pluck_code": "DIV_TI", "name": "Divisi TI", "type": "division", "parent": sevp_ti.id},
        {"pluck_code": "DIV_DIG", "name": "Divisi Digital Banking", "type": "division", "parent": sevp_ti.id},
        {"pluck_code": "DIV_UMUM", "name": "Divisi Umum", "type": "division", "parent": sevp_ti.id},
    ]

    stored_units = {"DIR_TI": dir_ti, "SEVP_TI": sevp_ti}
    for u in units:
        q = select(OrganizationUnit).where(OrganizationUnit.pluck_code == u["pluck_code"])
        result = await db.execute(q)
        unit = result.scalars().first()
        if not unit:
            unit = OrganizationUnit(pluck_code=u["pluck_code"], name=u["name"], type=u["type"], parent_id=u["parent"])
            db.add(unit)
            await db.flush()
        stored_units[u["pluck_code"]] = unit

    sub_units = [
        {"pluck_code": "EDM", "name": "Enterprise Data Management", "type": "subdivision", "parent": stored_units["DIV_TI"].id},
        {"pluck_code": "OPS_TI", "name": "Operasional TI", "type": "subdivision", "parent": stored_units["DIV_TI"].id},
        {"pluck_code": "DEV_DIG", "name": "Pengembangan Digital", "type": "subdivision", "parent": stored_units["DIV_DIG"].id},
        {"pluck_code": "QA_DIG", "name": "QA Digital", "type": "subdivision", "parent": stored_units["DIV_DIG"].id},
    ]
    for u in sub_units:
        q = select(OrganizationUnit).where(OrganizationUnit.pluck_code == u["pluck_code"])
        result = await db.execute(q)
        unit = result.scalars().first()
        if not unit:
            unit = OrganizationUnit(pluck_code=u["pluck_code"], name=u["name"], type=u["type"], parent_id=u["parent"])
            db.add(unit)
            await db.flush()
        stored_units[u["pluck_code"]] = unit

    non_ti = [
        {"pluck_code": "DIR_UTAMA", "name": "Direktorat Utama", "type": "directorate", "parent": None},
        {"pluck_code": "DIV_OPS", "name": "Divisi Operasi", "type": "division", "parent": None},
    ]
    for u in non_ti:
        q = select(OrganizationUnit).where(OrganizationUnit.pluck_code == u["pluck_code"])
        result = await db.execute(q)
        unit = result.scalars().first()
        if not unit:
            unit = OrganizationUnit(pluck_code=u["pluck_code"], name=u["name"], type=u["type"], parent_id=u["parent"])
            db.add(unit)
            await db.flush()
        stored_units[u["pluck_code"]] = unit

    # 3. Seed Permissions
    dashboard_keuangan_perms = [
        "view-dashboard-keuangan-j-prime",
        "view-dashboard-keuangan-grafik-dpk",
        "view-dashboard-keuangan-grafik-kredit",
        "view-dashboard-keuangan-grafik-lr",
        "view-dashboard-keuangan-grafik-cash-in-out",
        "view-dashboard-keuangan-dashboard-qris",
        "view-dashboard-keuangan-perkembangan-dpk-cabang",
        "view-dashboard-keuangan-perkembangan-kredit-cabang",
        "view-dashboard-keuangan-perkembangan-npl"
    ]

    dashboard_operasi_perms = [
        "view-dashboard-operasi-rekon-qris-aj",
        "view-dashboard-operasi-rekon-qris-prima",
        "view-dashboard-operasi-rekon-qris-onus",
        "view-dashboard-operasi-rekon-xl",
        "view-dashboard-operasi-rekon-kai",
        "view-dashboard-operasi-rekon-telkom",
        "view-dashboard-operasi-rekon-telkomsel",
        "view-dashboard-operasi-rekon-indosat",
        "view-dashboard-operasi-rekon-bpjs-kesehatan",
        "view-dashboard-operasi-rekon-indovision",
        "view-dashboard-operasi-rekon-mega-finance",
        "view-dashboard-operasi-rekon-smartfren",
        "view-dashboard-operasi-rekon-three",
        "view-dashboard-operasi-rekon-sknbi",
        "view-dashboard-operasi-rekon-rtgsbi",
        "view-dashboard-operasi-rekon-bifast"
    ]

    engine_monitoring_perms = [
        "manage-job-log", "view-job-log", "create-job-log", "update-job-log", "delete-job-log",
        "manage-engine-process-group", "view-engine-process-group", "view-engine-process-group-his",
        "create-engine-process-group", "update-engine-process-group", "delete-engine-process-group",
        "manage-sts-load-data", "view-sts-load-data", "view-sts-load-data-his",
        "create-sts-load-data", "update-sts-load-data", "delete-sts-load-data",
        "manage-sts-proses-rpt", "view-sts-proses-rpt", "view-sts-proses-rpt-his",
        "create-sts-proses-rpt", "update-sts-proses-rpt", "delete-sts-proses-rpt",
        "manage-engine-setting-db", "view-engine-setting-db", "create-engine-setting-db",
        "update-engine-setting-db", "delete-engine-setting-db"
    ]

    rbac_perms = [
        "manage-user", "view-user", "create-user", "update-user", "delete-user",
        "manage-role", "view-role", "create-role", "update-role", "delete-role",
        "manage-permission", "view-permission", "create-permission", "update-permission", "delete-permission",
        "manage-organization-unit", "view-organization-unit", "create-organization-unit",
        "update-organization-unit", "delete-organization-unit"
    ]

    mapping_user_perms = [
        "manage-mapping-user", "view-mapping-user", "create-mapping-user",
        "update-mapping-user", "delete-mapping-user"
    ]

    permissions_with_metadata = []
    for p in dashboard_keuangan_perms:
        permissions_with_metadata.append({"name": p, "owner": "Divisi Keuangan", "description": f"Akses viewing untuk {p.replace('view-dashboard-keuangan-', '')}"})
    for p in dashboard_operasi_perms:
        permissions_with_metadata.append({"name": p, "owner": "Divisi Operasi", "description": f"Akses rekon untuk {p.replace('view-dashboard-operasi-rekon-', '')}"})
    for p in engine_monitoring_perms:
        permissions_with_metadata.append({"name": p, "owner": "EDM", "description": f"Akses manajemen/view untuk engine {p.replace('manage-', '').replace('view-', '')}"})
    for p in rbac_perms:
        permissions_with_metadata.append({"name": p, "owner": "Administrator", "description": f"Akses manajemen user/role/unit untuk {p.split('-')[-1]}"})
    for p in mapping_user_perms:
        permissions_with_metadata.append({"name": p, "owner": "Administrator", "description": "Mapping user ke data/fitur spesifik"})

    all_perms = [p["name"] for p in permissions_with_metadata]

    stored_perms = {}
    for p_info in permissions_with_metadata:
        p_name = p_info["name"]
        q = select(Permission).where(Permission.name == p_name)
        result = await db.execute(q)
        perm = result.scalars().first()
        if not perm:
            perm = Permission(
                name=p_name,
                guard_name="web",
                owner=p_info.get("owner"),
                description=p_info.get("description")
            )
            db.add(perm)
        else:
            if not perm.owner:
                perm.owner = p_info.get("owner")
            if not perm.description:
                perm.description = p_info.get("description")
        await db.flush()
        stored_perms[p_name] = perm

    # 4. Seed Roles
    roles_config = [
        {"name": "super-admin", "perms": all_perms},
        {"name": "admin", "perms": rbac_perms + dashboard_keuangan_perms},
        {"name": "member", "perms": dashboard_keuangan_perms},
        {"name": "direksi", "perms": dashboard_keuangan_perms},
        {"name": "divisi-operasi", "perms": dashboard_operasi_perms},
    ]

    stored_roles = {}
    for r_conf in roles_config:
        q = select(Role).where(Role.name == r_conf["name"])
        result = await db.execute(q)
        role = result.scalars().first()
        if not role:
            role = Role(name=r_conf["name"], guard_name="web")
            db.add(role)
            await db.flush()
        stored_roles[r_conf["name"]] = role

        for p_name in r_conf["perms"]:
            perm = stored_perms[p_name]
            q = select(RoleHasPermission).where(
                RoleHasPermission.role_id == role.id,
                RoleHasPermission.permission_id == perm.id
            )
            result = await db.execute(q)
            if not result.scalars().first():
                db.add(RoleHasPermission(role_id=role.id, permission_id=perm.id))
        await db.flush()

    # 5. Seed Users
    users_data = [
        {"email": "direktur.ti@company.com", "name": "Direktur TI", "role": "member", "pos": "Direktur", "unit": "DIR_TI", "superior": None},
        {"email": "sevp.ti@company.com", "name": "SEVP TI", "role": "member", "pos": "SEVP", "unit": "SEVP_TI", "superior": "direktur.ti@company.com"},
        {"email": "vp.ti@company.com", "name": "VP TI", "role": "member", "pos": "VP", "unit": "DIV_TI", "superior": "sevp.ti@company.com"},
        {"email": "vp.digital@company.com", "name": "VP Digital Banking", "role": "member", "pos": "VP", "unit": "DIV_DIG", "superior": "sevp.ti@company.com"},
        {"email": "avp.edm@company.com", "name": "AVP EDM", "role": "member", "pos": "AVP", "unit": "EDM", "superior": "vp.ti@company.com"},
        {"email": "officer.edm@company.com", "name": "Officer EDM", "role": "super-admin", "pos": "Officer", "unit": "EDM", "superior": "avp.edm@company.com"},
        {"email": "admin@company.com", "name": "Admin Sekretaris", "role": "admin", "pos": "Officer", "unit": "DIR_TI", "superior": "direktur.ti@company.com"},
        {"email": "superadmin@company.com", "name": "Clear Super Admin", "role": "super-admin", "pos": "Officer", "unit": "EDM", "superior": None},
        {"email": "dirut@company.com", "name": "Direktur Utama", "role": "direksi", "pos": "Direktur", "unit": "DIR_UTAMA", "superior": None},
        {"email": "operasi@company.com", "name": "VP Operasi", "role": "divisi-operasi", "pos": "VP", "unit": "DIV_OPS", "superior": None},
        # Also keep the admin.com superadmin from old seed
        {"email": "superadmin@admin.com", "name": "Super Admin", "role": "super-admin", "pos": "Officer", "unit": "EDM", "superior": None},
    ]

    stored_users = {}
    for u_in in users_data:
        q = select(User).where(User.email == u_in["email"])
        result = await db.execute(q)
        user = result.scalars().first()

        superior_id = None
        if u_in["superior"] and u_in["superior"] in stored_users:
            superior_id = stored_users[u_in["superior"]].id

        if not user:
            user = User(
                email=u_in["email"],
                name=u_in["name"],
                password=get_password_hash("password"),
                position_id=positions[u_in["pos"]].id,
                organization_unit_id=stored_units[u_in["unit"]].id,
                direct_superior_id=superior_id
            )
            db.add(user)
            await db.flush()
        stored_users[u_in["email"]] = user

        # Link role — use "User" as model_type (IAM convention)
        role = stored_roles[u_in["role"]]
        q = select(ModelHasRole).where(
            ModelHasRole.role_id == role.id,
            ModelHasRole.model_id == user.id,
        )
        result = await db.execute(q)
        if not result.scalars().first():
            db.add(ModelHasRole(role_id=role.id, model_id=user.id, model_type="User"))
        await db.flush()

    await db.commit()
    print("IAM seeding completed successfully!")


async def seed_system_configs(db: AsyncSession) -> None:
    """
    Seed default system configuration values.
    Idempotent: inserts only keys that don't exist yet.
    Existing values are NEVER overwritten to preserve operator changes.
    """
    from app.models.system_config import SystemConfig, ConfigValueType

    default_configs = [
        # ── Security / Auth ──────────────────────────────────────────────────
        {
            "key": "auth.access_token_expire_minutes",
            "value": "15",
            "value_type": ConfigValueType.integer,
            "description": "Masa berlaku access token JWT dalam menit.",
            "is_editable": True,
            "is_sensitive": False,
        },
        {
            "key": "auth.refresh_token_expire_minutes",
            "value": "10080",
            "value_type": ConfigValueType.integer,
            "description": "Masa berlaku refresh token JWT dalam menit (default 7 hari = 10080).",
            "is_editable": True,
            "is_sensitive": False,
        },
        # ── CORS ─────────────────────────────────────────────────────────────
        {
            "key": "cors.allowed_origins",
            "value": "http://localhost:3000,http://localhost:8080,http://localhost",
            "value_type": ConfigValueType.list,
            "description": "Daftar origin yang diizinkan untuk CORS, dipisahkan koma.",
            "is_editable": True,
            "is_sensitive": False,
        },
        # ── System / UI ───────────────────────────────────────────────────────
        {
            "key": "system.app_name",
            "value": "Enterprise Dashboard",
            "value_type": ConfigValueType.string,
            "description": "Nama aplikasi yang ditampilkan di UI dan email notifikasi.",
            "is_editable": True,
            "is_sensitive": False,
        },
        {
            "key": "system.default_pagination_size",
            "value": "20",
            "value_type": ConfigValueType.integer,
            "description": "Jumlah item default per halaman pada tabel data.",
            "is_editable": True,
            "is_sensitive": False,
        },
        {
            "key": "system.maintenance_mode",
            "value": "false",
            "value_type": ConfigValueType.boolean,
            "description": "Aktifkan mode pemeliharaan (semua request non-admin akan ditolak).",
            "is_editable": True,
            "is_sensitive": False,
        },
        # ── Security ─────────────────────────────────────────────────────────
        {
            "key": "security.max_login_attempts",
            "value": "10",
            "value_type": ConfigValueType.integer,
            "description": "Maksimum percobaan login per menit sebelum diblokir (info: dikonfigurasikan ulang di Traefik).",
            "is_editable": True,
            "is_sensitive": False,
        },
        {
            "key": "security.session_warning_minutes",
            "value": "5",
            "value_type": ConfigValueType.integer,
            "description": "Berapa menit sebelum sesi habis, peringatan ditampilkan ke pengguna.",
            "is_editable": True,
            "is_sensitive": False,
        },
    ]

    for cfg in default_configs:
        result = await db.execute(
            select(SystemConfig).where(SystemConfig.key == cfg["key"])
        )
        if not result.scalars().first():
            db.add(SystemConfig(**cfg))

    await db.commit()
    print(f"System config seeding completed ({len(default_configs)} entries).")


async def seed_translations(db: AsyncSession) -> None:
    """
    Seed default UI translation strings for the 6 priority namespaces.
    Idempotent: only inserts rows that do NOT already exist.
    Existing values (edited by admins) are NEVER overwritten.

    Namespaces seeded: Common, Sidebar, Settings, Users, Roles, Permissions.
    Nested keys are stored using dot-notation (e.g. "themes.light.label").
    """
    from app.crud.crud_translation import translation as crud_translation

    # ── Helper: flatten nested dict into dot-notation keys ───────────────────
    def flatten(d: dict, prefix: str = "") -> dict:
        result = {}
        for k, v in d.items():
            full_key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                result.update(flatten(v, full_key))
            else:
                result[full_key] = str(v)
        return result

    # ── Translation data — mirrors id.ts / en.ts ──────────────────────────────

    ID_STRINGS: dict = {
        "Common": {
            "appTitle": "Manajemen Data Perusahaan",
            "add": "Tambah",
            "edit": "Edit",
            "delete": "Hapus",
            "save": "Simpan",
            "cancel": "Batal",
            "actions": "Aksi",
            "search": "Cari",
            "loading": "Memuat...",
            "noData": "Tidak ada data ditemukan",
            "confirm": "Konfirmasi",
            "success": "Berhasil",
            "error": "Gagal",
            "yes": "Ya",
            "no": "Tidak",
            "searchPlaceholder": "Cari sesuatu...",
        },
        "Sidebar": {
            "dashboard": "Dashboard",
            "direksi": "Direksi",
            "direkturUtama": "Dashboard J-Prime",
            "divisiOperasi": "Divisi Operasi",
            "summary": "Ringkasan Operasional",
            "rekonQris": "Rekon QRIS Artajasa",
            "rekonQrisRintis": "Rekon QRIS Rintis",
            "rekonQrisOnus": "Rekon QRIS On-us",
            "reports": "Laporan",
            "analytics": "Analitik",
            "userAccess": "Akses Pengguna",
            "settings": "Pengaturan",
            "support": "Bantuan",
            "profile": "Profil",
            "signOut": "Keluar",
            "accountSettings": "Pengaturan Akun",
            "manageRbac": "Kelola Role",
            "manageUser": "Manajemen User",
            "manageAccess": "Akses Pengguna",
            "managePermission": "Kelola Izin",
            "engine": "Engine",
            "reconciliation": "Rekonsiliasi",
            "importData": "Import Data",
            "monitoring": "Monitoring Engine",
            "noResults": "Tidak ada hasil ditemukan",
        },
        "Settings": {
            "title": "Pengaturan Pribadi",
            "subtitle": "Sesuaikan cara Anda berinteraksi dengan dashboard intelijen finansial Anda.",
            "visualTitle": "Pengalaman Visual",
            "visualSubtitle": "Pilih tampilan yang paling sesuai dengan ruang kerja Anda.",
            "comfortTitle": "Kenyamanan Dashboard",
            "comfortSubtitle": "Sesuaikan kepadatan informasi sesuai preferensi membaca Anda.",
            "langTitle": "Bahasa Dashboard",
            "langSubtitle": "Pilih bahasa pengantar untuk antarmuka pengguna.",
            "themes": {
                "light": {"label": "Mode Terang", "desc": "Warna lembut untuk lingkungan terang"},
                "dark": {"label": "Mode Gelap", "desc": "Mengurangi silau untuk fokus cahaya rendah"},
                "system": {"label": "Sinkronisasi Sistem", "desc": "Sesuai dengan preferensi perangkat Anda"},
            },
            "views": {
                "compact": {"label": "Tampilan Fokus", "desc": "Memaksimalkan visibilitas data untuk analisis mendalam"},
                "comfortable": {"label": "Tampilan Standar", "desc": "Keseimbangan klasik antara kejelasan dan informasi"},
                "large": {"label": "Tampilan Santai", "desc": "Legibilitas yang ditingkatkan untuk pemantauan tingkat tinggi"},
            },
            "languages": {"ID": "Bahasa Indonesia", "EN": "English (US)"},
            "footer": "© 2026 Manajemen Data Perusahaan",
            "privacy": "Kebijakan Privasi",
            "agreement": "Perjanjian Pengguna",
            "searchMenu": "Cari menu...",
            "navPersonal": "Personal",
            "navWorkspace": "Workspace",
            "navAppearance": "Tampilan",
            "navUsers": "Pengguna",
            "navRoles": "Role",
            "navPermissions": "Izin Akses",
            "navSystemConfig": "Konfigurasi Sistem",
            "navTranslations": "Terjemahan",
        },
        "Users": {
            "title": "Manajemen User",
            "subtitle": "Kelola pengguna, jabatan, unit kerja, dan hak akses.",
            "addButton": "Tambah User",
            "searchPlaceholder": "Cari nama atau email user...",
            "table": {
                "info": "Info User",
                "positionUnit": "Jabatan / Unit",
                "roles": "Akses (Role)",
                "actions": "Aksi",
                "loading": "Memuat data...",
                "empty": "Tidak ada data user ditemukan.",
            },
            "form": {
                "addTitle": "Tambah User Baru",
                "editTitle": "Edit User",
                "addDesc": "Tambahkan pengguna baru ke dalam sistem",
                "editDesc": "Perbarui informasi dan hak akses pengguna",
                "name": "Nama Lengkap",
                "namePlaceholder": "Contoh: Budi Santoso",
                "email": "Email / Username",
                "emailPlaceholder": "Contoh: budi@company.com",
                "password": "Kata Sandi",
                "passwordPlaceholderAdd": "Minimal 8 karakter",
                "passwordPlaceholderEdit": "Kosongkan jika tidak diubah",
                "passwordConfirm": "Konfirmasi Kata Sandi",
                "passwordConfirmPlaceholder": "Ulangi kata sandi",
                "role": "Role / Hak Akses",
                "position": "Jabatan",
                "positionPlaceholder": "-- Pilih Posisi --",
                "unit": "Unit Kerja / Divisi",
                "unitPlaceholder": "-- Pilih Unit Kerja --",
                "superior": "Atasan Langsung",
                "superiorPlaceholder": "-- Tanpa Atasan --",
                "permissionsOptional": "Direct Permissions (Opsional)",
                "permissionsOptionalDesc": "Centang untuk memberi hak ekstra di luar Role yang dipilih.",
                "successCreate": "User berhasil dibuat",
                "successUpdate": "User berhasil diperbarui",
                "errorSave": "Gagal menyimpan user",
                "validation": {
                    "nameRequired": "Nama lengkap wajib diisi.",
                    "nameMax": "Maksimal 255 karakter.",
                    "emailInvalid": "Format email tidak valid.",
                    "passwordMin": "Minimal 8 karakter.",
                    "passwordMismatch": "Konfirmasi password tidak cocok",
                },
            },
            "delete": {
                "confirmTitle": "Konfirmasi Hapus User",
                "confirmMessage": "Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.",
                "success": "User berhasil dihapus",
                "error": "Gagal menghapus user",
            },
        },
        "Roles": {
            "title": "Manajemen Role",
            "subtitle": "Kelola peran dan hak akses pada sistem.",
            "addButton": "Tambah Role",
            "searchPlaceholder": "Cari nama role...",
            "table": {
                "name": "Nama Role",
                "guard": "Guard",
                "permsCount": "Jumlah Hak Akses",
                "permsSuffix": "hak akses modular",
                "actions": "Aksi",
                "loading": "Memuat data...",
                "empty": "Tidak ada role yang ditemukan.",
                "adminDeleteError": "Role Administrator tidak dapat dihapus.",
                "adminDeleteTooltip": "Tidak dapat menghapus admin sistem",
            },
            "form": {
                "addTitle": "Tambah Role Baru",
                "editTitle": "Edit Role",
                "addDesc": "Buat peran baru dan tentukan hak aksesnya",
                "editDesc": "Perbarui nama peran dan pengaturan hak akses",
                "name": "Nama Role",
                "namePlaceholder": "Contoh: Manager Operasional",
                "guard": "Guard Name",
                "permissions": "Hak Akses (Permissions)",
                "moduleLabel": "Modul",
                "successCreate": "Role berhasil dibuat.",
                "successUpdate": "Role berhasil diperbarui.",
                "errorSave": "Gagal menyimpan role.",
                "validation": {
                    "nameRequired": "Nama Role wajib diisi.",
                    "nameMax": "Maksimal 255 karakter.",
                    "permissionsRequired": "Pilih minimal satu hak akses.",
                },
                "groups": {
                    "dashboardFinancial": "Dashboard Keuangan",
                    "opsQris": "Divisi Operasi (QRIS)",
                    "opsOther": "Divisi Operasi (Lainnya)",
                    "engine": "Monitoring Mesin",
                    "rbac": "Manajemen Akses (RBAC)",
                    "user": "Manajemen Pengguna",
                    "mapping": "Manajemen Mapping",
                    "organization": "Struktur Organisasi",
                    "other": "Lainnya",
                },
            },
            "delete": {
                "confirmTitle": "Konfirmasi Hapus Role",
                "confirmMessage": "Apakah Anda yakin ingin menghapus role ini? User yang memiliki role ini akan kehilangan akses terkait.",
                "success": "Role berhasil dihapus.",
                "error": "Gagal menghapus role.",
            },
        },
        "Permissions": {
            "title": "Manajemen Permission",
            "subtitle": "Kelola granularitas hak akses (permissions) untuk modul-modul di sistem Manajemen Data Perusahaan.",
            "addButton": "Tambah Permission",
            "searchPlaceholder": "Cari permission...",
            "table": {
                "name": "Nama",
                "owner": "Owner",
                "description": "Deskripsi",
                "actions": "Aksi",
                "loading": "Memuat data...",
                "empty": "Tidak ada data permission ditemukan.",
                "errorFetch": "Gagal memuat daftar permission",
            },
            "pagination": {
                "showing": "Menampilkan",
                "to": "hingga",
                "of": "dari",
                "entries": "entries",
                "prev": "Sblm",
                "next": "Lanjut",
            },
            "form": {
                "addTitle": "Tambah Permission Baru",
                "editTitle": "Edit Permission",
                "addDesc": "Tambahkan permission baru ke dalam sistem",
                "editDesc": "Ubah detail permission",
                "name": "Nama Permission",
                "namePlaceholder": "Contoh: manage-user",
                "guard": "Guard Name",
                "owner": "Owner / Divisi",
                "ownerPlaceholder": "Contoh: Divisi Operasi, IT, dsb.",
                "description": "Deskripsi",
                "descriptionPlaceholder": "Jelaskan kegunaan permission ini...",
                "successCreate": "Permission berhasil ditambahkan",
                "successUpdate": "Permission berhasil diperbarui",
                "errorSave": "Terjadi kesalahan, gagal menyimpan permission.",
                "validation": {
                    "nameRequired": "Nama Permission wajib diisi",
                    "guardRequired": "Guard Name wajib diisi",
                },
            },
            "delete": {
                "confirmTitle": "Hapus Permission",
                "confirmMessage": "Apakah Anda yakin ingin menghapus permission ini? Tindakan ini tidak dapat dibatalkan.",
                "success": "Permission berhasil dihapus",
                "error": "Gagal menghapus permission",
            },
        },
    }

    EN_STRINGS: dict = {
        "Common": {
            "appTitle": "Enterprise Data Management",
            "add": "Add",
            "edit": "Edit",
            "delete": "Delete",
            "save": "Save",
            "cancel": "Cancel",
            "actions": "Actions",
            "search": "Search",
            "loading": "Loading...",
            "noData": "No data found",
            "confirm": "Confirm",
            "success": "Success",
            "error": "Error",
            "yes": "Yes",
            "no": "No",
            "searchPlaceholder": "Search something...",
        },
        "Sidebar": {
            "dashboard": "Dashboard",
            "direksi": "Executive",
            "direkturUtama": "J-Prime Dashboard",
            "divisiOperasi": "Operations Division",
            "summary": "Operations Summary",
            "rekonQris": "QRIS AJ Recon",
            "rekonQrisRintis": "Rintis QRIS Recon",
            "rekonQrisOnus": "On-us QRIS Recon",
            "reports": "Reports",
            "analytics": "Analytics",
            "userAccess": "User Access",
            "settings": "Settings",
            "support": "Support",
            "profile": "Profile",
            "signOut": "Sign Out",
            "accountSettings": "Account Settings",
            "manageRbac": "Manage Roles",
            "manageUser": "User Management",
            "manageAccess": "User Access",
            "managePermission": "Manage Permissions",
            "engine": "Engine",
            "reconciliation": "Reconciliation",
            "importData": "Import Data",
            "monitoring": "Engine Monitoring",
            "noResults": "No results found",
        },
        "Settings": {
            "title": "Personal Preferences",
            "subtitle": "Customize how you interact with your financial intelligence dashboard.",
            "visualTitle": "Visual Experience",
            "visualSubtitle": "Choose the theme that best fits your workspace.",
            "comfortTitle": "Dashboard Comfort",
            "comfortSubtitle": "Adjust the information density to suit your reading preference.",
            "langTitle": "Dashboard Language",
            "langSubtitle": "Choose the primary language for the user interface.",
            "themes": {
                "light": {"label": "Light Mode", "desc": "Soft colors for bright environments"},
                "dark": {"label": "Dark Mode", "desc": "Reduce glare for low-light focus"},
                "system": {"label": "System Sync", "desc": "Matches your device preferences"},
            },
            "views": {
                "compact": {"label": "Focus View", "desc": "Maximize data visibility for deep analysis"},
                "comfortable": {"label": "Standard View", "desc": "Classic balance between clarity and information"},
                "large": {"label": "Relaxed View", "desc": "Enhanced legibility for high-level monitoring"},
            },
            "languages": {"ID": "Bahasa Indonesia", "EN": "English (US)"},
            "footer": "© 2026 Enterprise Data Management",
            "privacy": "Privacy Policy",
            "agreement": "User Agreement",
            "searchMenu": "Search menu...",
            "navPersonal": "Personal",
            "navWorkspace": "Workspace",
            "navAppearance": "Appearance",
            "navUsers": "Users",
            "navRoles": "Roles",
            "navPermissions": "Permissions",
            "navSystemConfig": "System Config",
            "navTranslations": "Translations",
        },
        "Users": {
            "title": "User Management",
            "subtitle": "Manage users, positions, organizational units, and access rights.",
            "addButton": "Add User",
            "searchPlaceholder": "Search user name or email...",
            "table": {
                "info": "User Info",
                "positionUnit": "Position / Unit",
                "roles": "Access (Role)",
                "actions": "Actions",
                "loading": "Loading data...",
                "empty": "No user data found.",
            },
            "form": {
                "addTitle": "Add New User",
                "editTitle": "Edit User",
                "addDesc": "Add a new user to the system",
                "editDesc": "Update user information and access rights",
                "name": "Full Name",
                "namePlaceholder": "Example: Budi Santoso",
                "email": "Email / Username",
                "emailPlaceholder": "Example: budi@company.com",
                "password": "Password",
                "passwordPlaceholderAdd": "Minimum 8 characters",
                "passwordPlaceholderEdit": "Leave blank if not changed",
                "passwordConfirm": "Confirm Password",
                "passwordConfirmPlaceholder": "Repeat password",
                "role": "Role / Access Rights",
                "position": "Position",
                "positionPlaceholder": "-- Select Position --",
                "unit": "Working Unit / Division",
                "unitPlaceholder": "-- Select Unit --",
                "superior": "Direct Superior",
                "superiorPlaceholder": "-- No Superior --",
                "permissionsOptional": "Direct Permissions (Optional)",
                "permissionsOptionalDesc": "Check to grant extra rights outside the selected Roles.",
                "successCreate": "User successfully created",
                "successUpdate": "User successfully updated",
                "errorSave": "Failed to save user",
                "validation": {
                    "nameRequired": "Full name is required.",
                    "nameMax": "Maximum 255 characters.",
                    "emailInvalid": "Invalid email format.",
                    "passwordMin": "Minimum 8 characters.",
                    "passwordMismatch": "Password confirmation does not match",
                },
            },
            "delete": {
                "confirmTitle": "Confirm Delete User",
                "confirmMessage": "Are you sure you want to delete this user? This action cannot be undone.",
                "success": "User successfully deleted",
                "error": "Failed to delete user",
            },
        },
        "Roles": {
            "title": "Role Management",
            "subtitle": "Manage roles and access rights in the system.",
            "addButton": "Add Role",
            "searchPlaceholder": "Search role name...",
            "table": {
                "name": "Role Name",
                "guard": "Guard",
                "permsCount": "Permissions Count",
                "permsSuffix": "modular perms",
                "actions": "Actions",
                "loading": "Loading data...",
                "empty": "No roles found.",
                "adminDeleteError": "Administrator role cannot be deleted.",
                "adminDeleteTooltip": "Cannot delete system admin",
            },
            "form": {
                "addTitle": "Add New Role",
                "editTitle": "Edit Role",
                "addDesc": "Create a new role and define its access rights",
                "editDesc": "Update role name and access right settings",
                "name": "Role Name",
                "namePlaceholder": "Example: Operations Manager",
                "guard": "Guard Name",
                "permissions": "Access Rights (Permissions)",
                "moduleLabel": "Module",
                "successCreate": "Role successfully created.",
                "successUpdate": "Role successfully updated.",
                "errorSave": "Failed to save role.",
                "validation": {
                    "nameRequired": "Role name is required.",
                    "nameMax": "Maximum 255 characters.",
                    "permissionsRequired": "Select at least one access right.",
                },
                "groups": {
                    "dashboardFinancial": "Financial Dashboard",
                    "opsQris": "Operations Division (QRIS)",
                    "opsOther": "Operations Division (Other)",
                    "engine": "Engine Monitoring",
                    "rbac": "Access Management (RBAC)",
                    "user": "User Management",
                    "mapping": "Mapping Management",
                    "organization": "Organization Structure",
                    "other": "Other",
                },
            },
            "delete": {
                "confirmTitle": "Confirm Delete Role",
                "confirmMessage": "Are you sure you want to delete this role? Users with this role will lose related access.",
                "success": "Role successfully deleted.",
                "error": "Failed to delete role.",
            },
        },
        "Permissions": {
            "title": "Permission Management",
            "subtitle": "Manage the granularity of access rights (permissions) for modules in the Enterprise Data Management system.",
            "addButton": "Add Permission",
            "searchPlaceholder": "Search permission...",
            "table": {
                "name": "Name",
                "owner": "Owner",
                "description": "Description",
                "actions": "Actions",
                "loading": "Loading data...",
                "empty": "No permission data found.",
                "errorFetch": "Failed to fetch permission list",
            },
            "pagination": {
                "showing": "Showing",
                "to": "to",
                "of": "of",
                "entries": "entries",
                "prev": "Prev",
                "next": "Next",
            },
            "form": {
                "addTitle": "Add New Permission",
                "editTitle": "Edit Permission",
                "addDesc": "Add a new permission to the system",
                "editDesc": "Change permission details",
                "name": "Permission Name",
                "namePlaceholder": "Example: manage-user",
                "guard": "Guard Name",
                "owner": "Owner / Division",
                "ownerPlaceholder": "Example: Operations Division, IT, etc.",
                "description": "Description",
                "descriptionPlaceholder": "Explain the purpose of this permission...",
                "successCreate": "Permission successfully added",
                "successUpdate": "Permission successfully updated",
                "errorSave": "An error occurred, failed to save permission.",
                "validation": {
                    "nameRequired": "Permission Name is required",
                    "guardRequired": "Guard Name is required",
                },
            },
            "delete": {
                "confirmTitle": "Delete Permission",
                "confirmMessage": "Are you sure you want to delete this permission? This action cannot be undone.",
                "success": "Permission successfully deleted",
                "error": "Failed to delete permission",
            },
        },
    }

    count = 0
    for lang_code, namespaces in (("ID", ID_STRINGS), ("EN", EN_STRINGS)):
        for namespace, strings in namespaces.items():
            for key, value in flatten(strings).items():
                await crud_translation.seed_upsert(
                    db,
                    namespace=namespace,
                    key=key,
                    language=lang_code,
                    value=value,
                )
                count += 1

    await db.commit()
    print(f"Translation seeding completed ({count} entries across ID + EN).")



async def main():
    async with AsyncSessionLocal() as db:
        await seed_data(db)

if __name__ == "__main__":
    asyncio.run(main())
