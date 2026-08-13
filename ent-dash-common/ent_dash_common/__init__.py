"""
ent-dash-common
==============
Shared library for all Enterprise Dashboard microservices.

Provides:
  - exceptions: Standardized AppException hierarchy and FastAPI handlers
  - auth:       Stateless JWT validation middleware (IAM-issued tokens)
  - responses:  Standard API response schemas (success, error, paginated)
  - logging:    Centralized structured logging setup
  - kafka:      Thin Kafka producer wrapper (optional — only if confluent-kafka is installed)
  - crud:       Generic async CRUDBase for SQLAlchemy models
  - db:         Async session factory and get_db dependency helper
"""
