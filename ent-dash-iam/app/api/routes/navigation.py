import json
import logging
from typing import Any, List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.system_config import SystemConfig

logger = logging.getLogger(__name__)
router = APIRouter()

def filter_menu_items(items: List[Dict], user_permissions: set) -> List[Dict]:
    filtered = []
    for item in items:
        # Check permissions
        required_perms = item.get("permission_required")
        has_access = True
        
        if required_perms:
            if isinstance(required_perms, str):
                required_perms = [required_perms]
            # User must have AT LEAST ONE of the required permissions to see the item
            has_access = any(perm in user_permissions for perm in required_perms)
            
        if not has_access:
            continue
            
        # If it's a dropdown/group, filter its children
        if "items" in item and item["items"]:
            item["items"] = filter_menu_items(item["items"], user_permissions)
            # Hide empty dropdowns/groups
            if not item["items"] and item.get("type") in ["dropdown", "group", "section", "menu"]:
                continue
                
        filtered.append(item)
    return filtered

@router.get("/menus")
async def get_navigation_menus(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Return navigation menus filtered by user's permissions."""
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "frontend.navigation.menus"))
    config = result.scalars().first()
    
    if not config:
        return []
        
    try:
        raw_menus = json.loads(config.value)
    except json.JSONDecodeError:
        logger.error("Failed to parse frontend.navigation.menus JSON")
        return []

    # Extract user permissions
    user_permissions = {p.name for r in (current_user.roles or []) for p in (r.permissions or [])}
    
    # Filter the menu tree
    filtered_menus = filter_menu_items(raw_menus, user_permissions)
    return filtered_menus
