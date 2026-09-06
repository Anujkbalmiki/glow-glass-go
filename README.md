# QPayslip

QPayslip is an India-focused payroll workspace with a Go API, React/TanStack frontend, Supabase persistence, and QR-verified payslip workflows.

The frontend requires Node.js 22.12 or newer. The backend requires Go 1.22 or newer.

This project was built with [Lovable](https://lovable.dev).

## Deployment

The TanStack Start frontend can be deployed directly to Vercel. Vercel detects the `tanstack-start` framework through `vercel.json`; configure the `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables in the Vercel project.

The Go API is containerized separately and should be deployed to a container host. Set the frontend's API base URL to that service when API-backed workflows are connected.

Run both services locally with Docker:

```sh
docker compose up --build
```

There are currently no AI features or AI runtime dependencies in QPayslip, so no separate AI container is required.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6d8357f8-b782-4baa-b8f3-7d20525913a2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
