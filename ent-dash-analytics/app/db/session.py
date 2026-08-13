from ent_dash_common.db import make_session_factory, make_get_db
from app.core.config import settings

AsyncSessionLocal = make_session_factory(
    settings.sqlalchemy_database_uri,
    pool_size=10,
    max_overflow=20,
)

get_db = make_get_db(AsyncSessionLocal)
engine = AsyncSessionLocal.kw['bind']
