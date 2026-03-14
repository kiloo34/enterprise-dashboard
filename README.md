# Enterprise Dashboard

A comprehensive enterprise dashboard system built with a microservices architecture. It includes features for financial and operational monitoring, granular Role-Based Access Control (RBAC), data reconciliation, and automated background processing.

## Architecture

The system is composed of several key components:

- **Frontend (`ent-dash-fe`)**: Next.js application with Tailwind CSS and shadcn/ui.
- **Backend API (`ent-dash-backend`)**: FastAPI application handling User Management, RBAC, and core dashboard data.
- **Recon Engine (`ent-dash-recon`)**: FastAPI application and Celery workers responsible for data import, processing, and reconciliation.
- **Infrastructure**: Managed via Docker Compose, including PostgreSQL, Redis, RabbitMQ, and Traefik (API Gateway).

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
- [Node.js](https://nodejs.org/) (v20+) (for local frontend development)
- [Python](https://www.python.org/) 3.11+ (for local backend development)

---

## Running the Application (Recommended: Docker)

The easiest way to run the entire stack is using Docker Compose. This will spin up the database, message queues, API gateway, backends, and frontend.

### 1. Configure Environment Variables

1. Copy `.env.example` to `.env` in the root directory (if available), or ensure the environment variables in `docker-compose.yml` fit your needs.
2. In `ent-dash-fe`, create or update `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost/api
   ```
   *(Note: If accessing from another device on your network, change `localhost` to your computer's local IP address, e.g., `172.20.10.4`)*.

### 2. Start the Services

Open your terminal in the root directory of the project and run:

```bash
docker compose up -d
```

This will download the necessary images, build the application containers, and start them in the background.

### 3. Access the Application

Once all containers are up and running, you can access the application at:

- **Frontend**: [http://localhost](http://localhost) (or `http://localhost:3000` depending on the build configuration)
- **Backend API Docs**: [http://localhost/api/docs](http://localhost/api/docs)
- **Traefik Dashboard**: [http://localhost:8080](http://localhost:8080)

### 4. Stopping the Services

To stop and remove the containers, networks, and volumes:

```bash
docker compose down
```

---

## Local Development (Without Docker for App Code)

If you prefer to run the application code locally (e.g., for faster UI iteration without rebuilding Docker images), follow these steps:

### 1. Start Support Infrastructure
You still need the database and message broker. Start only the necessary infrastructure services:

```bash
docker compose up -d db redis rabbitmq traefik
```

### 2. Run the Backend API (`ent-dash-backend`)

Open a new terminal session:

```bash
cd ent-dash-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Run the Recon Engine API (`ent-dash-recon`)

Open a new terminal session:

```bash
cd ent-dash-recon
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Run the Celery Worker (`ent-dash-recon`)

Open a new terminal session:

```bash
cd ent-dash-recon
source venv/bin/activate  # On Windows: venv\Scripts\activate
celery -A app.worker.celery_app worker --loglevel=info
```

### 5. Run the Frontend (`ent-dash-fe`)

Open a new terminal session:

```bash
cd ent-dash-fe
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

## Troubleshooting

- **Login Failed (CORS Error)**: If you are accessing the app from another device on your network, ensure the `NEXT_PUBLIC_API_URL` in the frontend's `.env.local` points to your machine's IP address (e.g., `http://192.168.1.x/api`), and that your IP is allowed in the CORS settings of both `main.py` files in the backend and recon services.
- **Port Conflicts**: Ensure ports `80`, `3000`, `5432`, `6379`, `5672`, `8000`, and `8080` are not being used by other applications on your system.
- **Database Connection Issues**: Verify the connection strings in the `.env` files match the credentials defined in `docker-compose.yml`.
