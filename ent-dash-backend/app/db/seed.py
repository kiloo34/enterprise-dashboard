import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, Position, OrganizationUnit
from app.models.role_permission import Role, Permission, RoleHasPermission, ModelHasRole
from app.models.dashboard import FinancialIndicator, FinancialMetric
from app.core.security import get_password_hash
from app.schemas.enums import RoleType

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
    # Root Direktorat
    q = select(OrganizationUnit).where(OrganizationUnit.pluck_code == "DIR_TI")
    result = await db.execute(q)
    dir_ti = result.scalars().first()
    if not dir_ti:
        dir_ti = OrganizationUnit(pluck_code="DIR_TI", name="Direktorat TI", type="directorate")
        db.add(dir_ti)
        await db.flush()

    # SEVP
    q = select(OrganizationUnit).where(OrganizationUnit.pluck_code == "SEVP_TI")
    result = await db.execute(q)
    sevp_ti = result.scalars().first()
    if not sevp_ti:
        sevp_ti = OrganizationUnit(pluck_code="SEVP_TI", name="SEVP TI", type="sevp", parent_id=dir_ti.id)
        db.add(sevp_ti)
        await db.flush()

    # Divisi
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

    # Sub Divisions
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

    # Non-TI Units
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

    # Define permission groups with metadata
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
            # Update existing metadata if empty
            if not perm.owner:
                perm.owner = p_info.get("owner")
            if not perm.description:
                perm.description = p_info.get("description")

        await db.flush()
        stored_perms[p_name] = perm

    # 4. Seed Roles
    roles_config = [
        {"name": RoleType.SUPER_ADMIN.value, "perms": all_perms},
        {"name": RoleType.ADMIN.value, "perms": rbac_perms + dashboard_keuangan_perms},
        {"name": RoleType.MEMBER.value, "perms": dashboard_keuangan_perms}, # Use new specific permissions instead of 'view-dashboard'
        {"name": RoleType.DIREKSI.value, "perms": dashboard_keuangan_perms},
        {"name": RoleType.DIVISI_OPERASI.value, "perms": dashboard_operasi_perms},
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

        # Link permissions
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
        {"email": "direktur.ti@company.com", "name": "Direktur TI", "role": RoleType.MEMBER, "pos": "Direktur", "unit": "DIR_TI", "superior": None},
        {"email": "sevp.ti@company.com", "name": "SEVP TI", "role": RoleType.MEMBER, "pos": "SEVP", "unit": "SEVP_TI", "superior": "direktur.ti@company.com"},
        {"email": "vp.ti@company.com", "name": "VP TI", "role": RoleType.MEMBER, "pos": "VP", "unit": "DIV_TI", "superior": "sevp.ti@company.com"},
        {"email": "vp.digital@company.com", "name": "VP Digital Banking", "role": RoleType.MEMBER, "pos": "VP", "unit": "DIV_DIG", "superior": "sevp.ti@company.com"},
        {"email": "avp.edm@company.com", "name": "AVP EDM", "role": RoleType.MEMBER, "pos": "AVP", "unit": "EDM", "superior": "vp.ti@company.com"},
        {"email": "officer.edm@company.com", "name": "Officer EDM", "role": RoleType.SUPER_ADMIN, "pos": "Officer", "unit": "EDM", "superior": "avp.edm@company.com"},
        {"email": "admin@company.com", "name": "Admin Sekretaris", "role": RoleType.ADMIN, "pos": "Officer", "unit": "DIR_TI", "superior": "direktur.ti@company.com"},
        {"email": "superadmin@company.com", "name": "Clear Super Admin", "role": RoleType.SUPER_ADMIN, "pos": "Officer", "unit": "EDM", "superior": None},
        {"email": "dirut@company.com", "name": "Direktur Utama", "role": RoleType.DIREKSI, "pos": "Direktur", "unit": "DIR_UTAMA", "superior": None},
        {"email": "operasi@company.com", "name": "VP Operasi", "role": RoleType.DIVISI_OPERASI, "pos": "VP", "unit": "DIV_OPS", "superior": None},
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

        # Link role
        role = stored_roles[u_in["role"].value]
        q = select(ModelHasRole).where(
            ModelHasRole.role_id == role.id,
            ModelHasRole.model_id == user.id,
            ModelHasRole.model_type == "App\\Models\\User"
        )
        result = await db.execute(q)
        if not result.scalars().first():
            db.add(ModelHasRole(role_id=role.id, model_id=user.id, model_type="App\\Models\\User"))
        await db.flush()

    await db.commit()
    print("Core seeding completed successfully!")

async def seed_financial_data(db: AsyncSession):
    # All 37 indicators organized by category
    indicators = [
        # DPK ROOT
        {"slug": "cat_dpk", "label": "DANA PIHAK KETIGA (DPK)", "category": "DPK", "level": 0, "is_bold": True},
        {"slug": "total_dpk", "label": "TOTAL DPK", "category": "DPK", "level": 1, "is_bold": True, "is_link": True, "parent_slug": "cat_dpk"},
        {"slug": "giro", "label": "GIRO", "category": "DPK", "level": 2, "is_bold": True, "parent_slug": "total_dpk"},
        {"slug": "giro_pemda", "label": "GIRO PEMDA", "category": "DPK", "level": 3, "parent_slug": "giro"},
        {"slug": "giro_swasta_lembaga", "label": "GIRO SWASTA LEMBAGA", "category": "DPK", "level": 3, "parent_slug": "giro"},
        {"slug": "giro_perorangan", "label": "GIRO PERORANGAN", "category": "DPK", "level": 3, "parent_slug": "giro"},
        {"slug": "tabungan", "label": "TABUNGAN", "category": "DPK", "level": 2, "is_bold": True, "parent_slug": "total_dpk"},
        {"slug": "deposito", "label": "DEPOSITO", "category": "DPK", "level": 2, "is_bold": True, "parent_slug": "total_dpk"},
        {"slug": "deposito_pemda", "label": "DEPOSITO PEMDA", "category": "DPK", "level": 3, "parent_slug": "deposito"},
        {"slug": "deposito_swasta_lembaga", "label": "DEPOSITO SWASTA LEMBAGA", "category": "DPK", "level": 3, "parent_slug": "deposito"},
        {"slug": "deposito_perorangan", "label": "DEPOSITO PERORANGAN", "category": "DPK", "level": 3, "parent_slug": "deposito"},
        {"slug": "casa", "label": "CASA", "category": "DPK", "level": 2, "parent_slug": "total_dpk"},
        
        # KREDIT ROOT
        {"slug": "cat_kredit", "label": "PENYALURAN DANA (KREDIT)", "category": "KREDIT", "level": 0, "is_bold": True},
        {"slug": "kredit", "label": "KREDIT", "category": "KREDIT", "level": 1, "is_bold": True, "parent_slug": "cat_kredit"},
        {"slug": "tlf", "label": "TLF", "category": "KREDIT", "level": 2, "parent_slug": "kredit"},
        {"slug": "konsumer", "label": "KONSUMER", "category": "KREDIT", "level": 2, "parent_slug": "kredit"},
        {"slug": "korporasi", "label": "KORPORASI", "category": "KREDIT", "level": 2, "parent_slug": "kredit"},
        {"slug": "mikro", "label": "MIKRO", "category": "KREDIT", "level": 2, "parent_slug": "kredit"},
        {"slug": "ritel", "label": "RITEL", "category": "KREDIT", "level": 2, "parent_slug": "kredit"},
        {"slug": "menengah", "label": "MENENGAH", "category": "KREDIT", "level": 2, "parent_slug": "kredit"},
        {"slug": "pembiayaan", "label": "PEMBIAYAAN", "category": "KREDIT", "level": 2, "parent_slug": "kredit"},
        
        # LABA RUGI ROOT
        {"slug": "cat_lr", "label": "LABA RUGI", "category": "Laba Rugi", "level": 0, "is_bold": True},
        {"slug": "pend_bunga", "label": "PEND BUNGA", "category": "Laba Rugi", "level": 1, "parent_slug": "cat_lr"},
        {"slug": "by_bunga", "label": "BY BUNGA", "category": "Laba Rugi", "level": 1, "parent_slug": "cat_lr"},
        {"slug": "pend_ops_selain_bunga", "label": "PEND OPS SELAIN BUNGA", "category": "Laba Rugi", "level": 1, "parent_slug": "cat_lr"},
        {"slug": "by_ops_selain_bunga", "label": "BY OPS SELAIN BUNGA", "category": "Laba Rugi", "level": 1, "parent_slug": "cat_lr"},
        {"slug": "pend_non_ops", "label": "PEND NON OPS", "category": "Laba Rugi", "level": 1, "parent_slug": "cat_lr"},
        {"slug": "by_non_ops", "label": "BY NON OPS", "category": "Laba Rugi", "level": 1, "parent_slug": "cat_lr"},
        {"slug": "laba_rugi_sebelum_pajak", "label": "LABA RUGI SEBELUM PAJAK", "category": "Laba Rugi", "level": 1, "is_bold": True, "parent_slug": "cat_lr"},
        {"slug": "laba_rugi_bersih", "label": "LABA RUGI BERSIH", "category": "Laba Rugi", "level": 1, "is_bold": True, "parent_slug": "cat_lr"},

        # ASET ROOT
        {"slug": "cat_aset", "label": "ASET", "category": "ASET", "level": 0, "is_bold": True},
        {"slug": "total_aset", "label": "TOTAL ASET", "category": "ASET", "level": 1, "is_bold": True, "parent_slug": "cat_aset"},
        {"slug": "total_ckpn_kredit", "label": "TOTAL CKPN KREDIT", "category": "ASET", "level": 2, "parent_slug": "total_aset"},
        {"slug": "total_ckpn_pembiayaan", "label": "TOTAL CKPN PEMBIAYAAN", "category": "ASET", "level": 2, "parent_slug": "total_aset"},

        # RATIO ROOT
        {"slug": "cat_ratio", "label": "RATIO", "category": "RATIO", "level": 0, "is_bold": True},
        {"slug": "npl", "label": "NPL (%)", "category": "RATIO", "level": 1, "is_bold": True, "is_ratio": True, "parent_slug": "cat_ratio"},
        {"slug": "npf", "label": "NPF (%)", "category": "RATIO", "level": 1, "is_bold": True, "is_ratio": True, "parent_slug": "cat_ratio"},
        {"slug": "roa", "label": "ROA (%)", "category": "RATIO", "level": 1, "is_bold": True, "is_ratio": True, "parent_slug": "cat_ratio"},
        {"slug": "nim", "label": "NIM (%)", "category": "RATIO", "level": 1, "is_bold": True, "is_ratio": True, "parent_slug": "cat_ratio"},
        {"slug": "bopo", "label": "BOPO (%)", "category": "RATIO", "level": 1, "is_bold": True, "is_ratio": True, "parent_slug": "cat_ratio"},
        {"slug": "ldr", "label": "LDR (%)", "category": "RATIO", "level": 1, "is_bold": True, "is_ratio": True, "parent_slug": "cat_ratio"},
        {"slug": "fdr", "label": "FDR (%)", "category": "RATIO", "level": 1, "is_bold": True, "is_ratio": True, "parent_slug": "cat_ratio"},
    ]


    stored_inds = {}
    for ind_in in indicators:
        q = select(FinancialIndicator).where(FinancialIndicator.slug == ind_in["slug"])
        result = await db.execute(q)
        ind = result.scalars().first()
        
        parent_id = None
        if "parent_slug" in ind_in:
            parent_id = stored_inds[ind_in["parent_slug"]].id

        if not ind:
            ind = FinancialIndicator(
                slug=ind_in["slug"],
                label=ind_in["label"],
                category=ind_in["category"],
                level=ind_in["level"],
                is_bold=ind_in.get("is_bold", False),
                is_link=ind_in.get("is_link", False),
                is_ratio=ind_in.get("is_ratio", False),
                parent_id=parent_id
            )
            db.add(ind)
            await db.flush()
        stored_inds[ind_in["slug"]] = ind

    # 2. Financial Metrics Seed (Mock historical data)
    from datetime import date, timedelta
    today = date(2026, 3, 14)

    metrics_data = [
        {"slug": "total_dpk", "val": 9420, "target": 11000, "dtd": 45, "mtd": 120, "ytd": 540},
        {"slug": "giro", "val": 4120, "target": 4500, "dtd": 5, "mtd": -12, "ytd": 210},
        {"slug": "kredit", "val": 5340, "target": 5500, "dtd": 15, "mtd": 45, "ytd": 280},
        {"slug": "npl", "val": 1.21, "target": 1.50, "dtd": 0.01, "mtd": 0.03, "ytd": 0.15},
    ]

    for m_in in metrics_data:
        q = select(FinancialMetric).where(
            FinancialMetric.indicator_id == stored_inds[m_in["slug"]].id,
            FinancialMetric.report_date == today
        )
        result = await db.execute(q)
        metric = result.scalars().first()
        if not metric:
            metric = FinancialMetric(
                indicator_id=stored_inds[m_in["slug"]].id,
                report_date=today,
                value=m_in["val"],
                target_nominal=m_in["target"],
                dtd_nominal=m_in["dtd"],
                dtd_pct=round((m_in["dtd"] / (m_in["val"] - m_in["dtd"]) * 100), 2) if m_in["val"] != m_in["dtd"] else 0,
                mtd_nominal=m_in["mtd"],
                mtd_pct=round((m_in["mtd"] / (m_in["val"] - m_in["mtd"]) * 100), 2) if m_in["val"] != m_in["mtd"] else 0,
                ytd_nominal=m_in["ytd"],
                ytd_pct=round((m_in["ytd"] / (m_in["val"] - m_in["ytd"]) * 100), 2) if m_in["val"] != m_in["ytd"] else 0,
            )
            db.add(metric)
    
    await db.commit()
    print("Financial seeding completed successfully!")

async def main():
    async with AsyncSessionLocal() as db:
        await seed_data(db)
        await seed_financial_data(db)

if __name__ == "__main__":
    asyncio.run(main())
