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


async def main():
    async with AsyncSessionLocal() as db:
        await seed_data(db)

if __name__ == "__main__":
    asyncio.run(main())
