# MyTrip frontend

Next.js 13 (Pages Router), React 18, and Tailwind CSS user interface for MyTrip.

## Run locally

For the complete database-backed stack, follow the Docker Compose instructions in the repository [README](../README.md).

To run the frontend on its own:

```sh
npm ci
```

Set `NEXT_PUBLIC_API_BASE_URL` to the backend API origin (for local development, `http://localhost:8082`), then run:

```sh
npm run dev
```

Open <http://localhost:3000>.

## Validate

```sh
npm run lint
npm run build
npm run test:e2e
```

The API journey tests require the backend and MySQL services to be running. See the root [README](../README.md) for the Docker Compose commands.

## Container

The frontend `Dockerfile` is used by the root Docker Compose files. Its public API URL is configured at build time; use the production Compose setup and HTTPS URLs when deploying.

## Deploy to Vercel

For the complete Vercel + OCI setup, follow the deployment guide in the repository [README](../README.md). In Vercel, set the project root directory to `frontend` and configure:

- `NEXT_PUBLIC_API_BASE_URL`: the OCI-hosted API's public HTTPS origin, used by browser requests.
- `API_INTERNAL_URL`: the same API origin, used by server-rendered hotel pages.

Use the API origin without `/api` or a trailing slash. Configure these variables for each Vercel environment you deploy (Production and, optionally, Preview), then redeploy after changing them.
