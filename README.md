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

## Recommended cloud deployment: Vercel + Railway

Use Vercel for the Next.js frontend and Railway for the Spring Boot API and MySQL database. Vercel does not host this Spring Boot service or its MySQL database as part of the Next.js deployment.

### 1. Deploy the API and database on Railway

1. Create a Railway project from this GitHub repository and add a MySQL service.
2. Add a service for the repository, set its root directory to `/backend`, and deploy using the included `backend/Dockerfile`. Generate a public domain for the API service.
3. Configure these backend service variables. Replace `MySQL` in Railway's variable references with the exact name of your MySQL service if it differs:

   ```text
   SPRING_DATASOURCE_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   SPRING_DATASOURCE_USERNAME=${{MySQL.MYSQLUSER}}
   SPRING_DATASOURCE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   APP_JWT_SECRET=<a unique, randomly generated secret of at least 32 bytes>
   APP_SEED_DEMO_USERS=false
   APP_INITIAL_ADMIN_EMAIL=<your administrator email>
   APP_INITIAL_ADMIN_PASSWORD=<a unique, strong administrator password>
   APP_UPLOAD_DIR=/app/uploads/reviews
   APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>
   ```

   Add a Railway persistent volume to the backend service mounted at `/app/uploads` so user-uploaded review photos survive redeploys. Keep the database on Railway's private network; do not expose its port publicly. Keep all credentials in Railway's Variables UI, never in source control.
4. Deploy and note the API's public HTTPS origin, for example `https://mytrip-api.up.railway.app`. Do not add `/api` or a trailing slash to the origin.

### 2. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel and set the project root directory to `frontend`. Vercel should detect Next.js automatically.
2. Add these environment variables for Production (and Preview too, if you want preview deployments to call the API):

   ```text
   NEXT_PUBLIC_API_BASE_URL=https://<your-railway-api-domain>
   API_INTERNAL_URL=https://<your-railway-api-domain>
   ```

   Set both to the Railway API origin, without `/api` or a trailing slash. `NEXT_PUBLIC_API_BASE_URL` is used by browser requests; `API_INTERNAL_URL` is used when Next.js renders hotel pages on the server.
3. Deploy. Copy the assigned Vercel origin (or configure a custom domain), then set Railway's `APP_CORS_ALLOWED_ORIGINS` to that exact HTTPS origin, with no trailing slash. If it changes, update the variable and redeploy the API.
4. Verify the frontend loads hotels and flights, register or sign in, and check that hotel pages, bookings, and review-photo uploads work.

Vercel and Railway deployment require accounts on those providers. This repository includes the application configuration and steps, but does not deploy automatically or include provider credentials. Payments are still simulated and flight status data is mocked.

## Self-hosted production deployment with Docker Compose

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
