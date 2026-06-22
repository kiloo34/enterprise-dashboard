from sqlalchemy.orm import declarative_base

# Decoupled Base to prevent Circular Imports
# Do NOT import any models here — models import Base, causing circular imports.
Base = declarative_base()
