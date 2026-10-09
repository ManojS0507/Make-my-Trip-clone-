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

## Recommended free-tier deployment: Vercel + OCI

Deploy the Next.js frontend to Vercel and run the Spring Boot API and MySQL together on an Oracle Cloud Infrastructure (OCI) Always Free Ampere VM using Docker Compose. Vercel does not host this project's Spring Boot service or persistent MySQL database. OCI Always Free capacity and eligibility are subject to Oracle's current terms and regional availability; idle instances may be reclaimed. See [OCI Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) and [Vercel pricing](https://vercel.com/pricing) before you begin.

### 1. Create the OCI VM

1. Create an OCI account and select your home region carefully. Oracle may require a payment card for identity verification.
2. Create an Ubuntu Ampere A1 Flex VM in the Always Free allowance (up to 2 OCPUs and 12 GB memory total). If the shape is unavailable, try again later or another availability domain in your home region; avoid selecting a paid shape.
3. Assign a public IPv4 address. In the VCN security list or network security group, allow inbound TCP 22 only from your own IP, plus TCP 80 and 443 for web traffic. Do not open MySQL port 3306 or the backend's port 8082 to the internet.
4. Point a domain or free dynamic-DNS hostname's A record to the VM's public IP. A hostname is needed for the recommended automatic HTTPS setup.
5. Connect to the VM over SSH and install Docker Engine with the Compose plugin, following Docker's official Ubuntu installation instructions. Clone this repository to the VM.

### 2. Run the API and MySQL on OCI

1. In the repository on the VM, copy `deploy/production.env.example` to `deploy/production.env`. Replace every placeholder with unique values. Use strong database/admin passwords and a randomly generated JWT secret; keep this file private.
2. Set `MYTRIP_FRONTEND_URL` to the Vercel origin you will use (for example, `https://mytrip.vercel.app`) and `MYTRIP_API_URL` to the API hostname (for example, `https://api.example.com`). Keep the template's `BACKEND_PORT=8082`.
3. Start only MySQL and the backend; Vercel will serve the frontend:

   ```sh
   docker compose --env-file deploy/production.env -f docker-compose.production.yml up --build -d db backend
   ```

   The MySQL database remains on Docker's private network. Uploaded review photos are stored in the persistent `uploads_data` Docker volume. Back up both the database and uploaded files regularly.
4. Install Caddy on the VM and configure a site for your API hostname to reverse-proxy to `127.0.0.1:8082`. For example, for the hostname `api.example.com`, the Caddyfile site can be:

   ```text
   api.example.com {
       reverse_proxy 127.0.0.1:8082
   }
   ```

   Caddy can obtain and renew HTTPS certificates automatically when DNS points to the VM and ports 80/443 are reachable. Also enable the VM's operating-system firewall for SSH, HTTP, and HTTPS only. The OCI network rules must block public access to port 8082 even though Docker publishes it on the VM.
5. Check the services and logs:

   ```sh
   docker compose --env-file deploy/production.env -f docker-compose.production.yml ps
   docker compose --env-file deploy/production.env -f docker-compose.production.yml logs -f backend db
   ```

### 3. Deploy the frontend on Vercel

1. Import the GitHub repository into Vercel and set the project root directory to `frontend`.
2. Add these environment variables for Production (and Preview too, if desired), using the API's HTTPS origin without `/api` or a trailing slash:

   ```text
   NEXT_PUBLIC_API_BASE_URL=https://api.example.com
   API_INTERNAL_URL=https://api.example.com
   ```

   `NEXT_PUBLIC_API_BASE_URL` is used by browser requests; `API_INTERNAL_URL` is used when Next.js renders hotel pages on the server.
3. Deploy and verify that listings, registration/login, hotel detail pages, bookings, and review-photo uploads work. The `APP_CORS_ALLOWED_ORIGINS` value in `deploy/production.env` must exactly match the Vercel origin; update it and restart the backend if the Vercel domain changes.

OCI account setup may require card verification, free VM capacity is not guaranteed in every region, and idle-instance reclamation can affect availability. Keep an eye on OCI usage and back up application data. Payments are simulated and flight status data is mocked; this app is not ready to process real payments or receive live airline data.

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
