# Make-my-Trip-clone- (MyTrip)

MyTrip is a travel booking web application with a Next.js frontend, a Spring Boot REST API, and a MySQL database. It includes hotel and flight listings, booking and confirmation flows, cancellation/refund tracking, reviews, mock flight updates, price history, and recommendations.

> **Payment and live-data notice:** Checkout currently records a demo payment reference; it does not charge a card or UPI account. Flight updates are simulated. Do not present this application as accepting real payments or receiving live airline data.

## Stack

- Frontend: Next.js 13, React 18, Node.js 18
- Backend: Java 17, Spring Boot 3.2, Maven
- Database: MySQL 8
- Local/deployment orchestration: Docker Compose

## Quick start with Docker

### Requirements

- Docker Engine/Desktop with the Compose plugin
- At least 4 GB of available memory for the containers

### Start locally

From the project root, create a local environment file and start the services:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

macOS/Linux:

```sh
cp .env.example .env
docker compose up --build -d
```

Open:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8082/api>

The first start creates sample hotels, flights, and local demo accounts. Local demo credentials are listed in the comments in `.env.example`; they are for development only. The MySQL database and uploaded review images are stored in named Docker volumes and persist across container restarts.

Stop the services without deleting database data:

```sh
docker compose down
```

To intentionally remove local database and upload data as well, use `docker compose down --volumes`. This deletes the local Compose volumes.

## Production deployment with Docker Compose

The production Compose file builds the frontend and backend containers and keeps MySQL off the host-published ports. It expects a public frontend URL, a public API URL, unique credentials, and an initial administrator password.

1. Copy `deploy/production.env.example` to `deploy/production.env`.
2. Replace every example value with deployment-specific values. Generate strong random database passwords and a JWT secret; do not reuse the example strings.
3. Set `MYTRIP_FRONTEND_URL` to the browser-facing frontend origin and `MYTRIP_API_URL` to the browser-facing API base URL, including `https://` and without a trailing slash. The CORS allowlist is set from `MYTRIP_FRONTEND_URL`.
4. Put a TLS reverse proxy or managed HTTPS ingress in front of the frontend and API. Configure it to forward traffic to the published frontend and backend ports.
5. Start the stack:

   ```sh
   docker compose --env-file deploy/production.env -f docker-compose.production.yml up --build -d
   ```

6. Check status and logs:

   ```sh
   docker compose --env-file deploy/production.env -f docker-compose.production.yml ps
   docker compose --env-file deploy/production.env -f docker-compose.production.yml logs -f backend frontend
   ```

Use a managed database or a tested backup/restore process for production data. The bundled Compose database volume is persistent but is not itself a backup or high-availability strategy. Back up the database and review the schema migration strategy before application upgrades. Keep `deploy/production.env` private; it is ignored by Git.

The configured initial administrator is created only when the database has no users. Store its password securely and change it after the first sign-in. Production disables the built-in demo accounts.

## Run checks

With the local Docker Compose app running:

```sh
cd frontend
npm ci
npm run lint
npm run build
npm run test:e2e
```

Backend build and tests:

```sh
cd backend
mvn clean verify
```

The API journey tests use the running app and create isolated test accounts. They exercise bookings, cancellation/refunds, flight tracking/pricing/recommendations, and review moderation.

## GitHub Actions

The workflow in `.github/workflows/ci-cd.yml` runs backend and frontend checks, starts the Docker Compose stack, and executes the API journey tests. It does not publish container images or deploy to a hosting provider; add provider credentials and a reviewed deployment job only after selecting a host.

## Project layout

```text
backend/                     Spring Boot API and Dockerfile
frontend/                    Next.js app, tests, and Dockerfile
deploy/                      Production environment template
.github/workflows/           GitHub Actions validation
docker-compose.yml           Local development stack
docker-compose.production.yml Self-hosted production stack
```

More detailed service notes are in [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).
