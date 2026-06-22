from sqlalchemy.orm import declarative_base

# Do NOT import models here — models import Base, causing circular imports.
# Models are imported in init_db.py before Base.metadata.create_all is called.
Base = declarative_base()
