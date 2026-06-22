# ent-dash-common

Shared Python library for all **Enterprise Dashboard** microservices.

## Modules

| Module | Description |
|:--|:--|
| `exceptions` | Standardized `AppException` hierarchy + FastAPI global error handlers |
| `auth` | Stateless JWT validation factory (`make_jwt_dependency`) |
| `responses` | Standard response schemas (`SuccessResponse`, `PaginatedResponse`, `HealthResponse`) |
| `logging` | Centralized structured logging setup (`setup_logging`) |
| `kafka` | Thin Kafka/Redpanda producer wrapper (`publish_event`) |

## Installation in each service

Add to the service's `requirements.txt`:

```
# Install common library from local path
-e ../ent-dash-common
```

Or in the Dockerfile (when copying the common package):

```dockerfile
COPY ../ent-dash-common /ent-dash-common
RUN pip install -e /ent-dash-common
```

## Usage Examples

### Exception handling (any service)
```python
from ent_dash_common.exceptions import setup_exception_handlers, NotFoundException

setup_exception_handlers(app)   # called once in create_app()

raise NotFoundException(message="User not found", code="USER_NOT_FOUND")
```

### Stateless JWT auth (Analytics, Engine, Recon)
```python
from fastapi import Depends
from ent_dash_common.auth import make_jwt_dependency

verify_token = make_jwt_dependency(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    api_prefix=settings.API_V1_STR
)

@router.get("/protected")
async def my_route(payload: dict = Depends(verify_token)):
    user_id = int(payload["sub"])
```

### Kafka event publishing (Engine, Analytics)
```python
from ent_dash_common.kafka import publish_event

publish_event(
    bootstrap_servers="redpanda:9092",
    topic="engine.file_uploaded",
    payload={"import_id": "abc", "object_name": "imports/2026/01/01/abc.csv"},
    key="abc",
    client_id="engine-service",
)
```
