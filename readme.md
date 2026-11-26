# Stack Builders Wellness Platform

A role-based employee wellness platform built with a React single-page application and a NestJS REST API. The platform brings company administration, employee wellness activities, consultations, live sessions, and wellness video content into one workspace.

## Features

- **Employees:** wellness check-ins and forms, expert consultations, live sessions, videos, challenges, and rewards.
- **Wellness experts:** consultation requests, availability, live sessions, employee check-ins, and video uploads.
- **HR:** employee and expert management, challenges and rewards, video library, and subscription plans.
- **Administrators and supervisors:** company and account management, role access, reports, revenue, queries, and settings.

## Project layout

```text
.
├── front-end/
│   └── react-app/    # React + Vite application
│       ├── public/   # Static assets and page stylesheets
│       └── src/      # React pages, components, and API clients
├── back-end/         # NestJS API, tests, and uploaded media
├── Database/         # Project database/design materials
├── FigmaDesigns/     # Design materials
└── Videos/           # Project video resources
```

## Requirements

- Node.js **20.19+** or **22.12+**
- npm

## Run locally

Start the backend first. In a terminal at the repository root:

```bash
cd back-end
npm ci
npm run start:dev
```

The API runs at `http://127.0.0.1:3000`. Swagger API documentation is at `http://127.0.0.1:3000/api/docs`.

### Password recovery email

The forgot-password flow sends a six-digit code through SMTP. Copy `back-end/.env.example` to `back-end/.env` and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` for your mail provider before starting the API. The code expires after 10 minutes, can be requested at most three times per hour per email, and allows five verification attempts. Recovery currently covers employee, wellness expert, HR, and built-in demo accounts. The same SMTP setup sends company-request receipts, reviewer alerts, approval or rejection emails, and an HR sign-in invitation. Set `ONBOARDING_REVIEW_EMAIL` to change the reviewer recipient (defaults to `raju@gmail.com`) and `FRONTEND_URL` to set the app link included in those emails (defaults to `http://127.0.0.1:5173`).

Open a second terminal at the repository root to start the React app:

```bash
cd front-end/react-app
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). The frontend uses `http://127.0.0.1:3000` as its default API address. If the backend is running elsewhere, create `front-end/react-app/.env.local` with:

```text
VITE_API_BASE_URL=http://127.0.0.1:3000
```

Stop either server with **Ctrl+C** in its terminal.

## Demo sign-in

The homepage includes these local demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `ravi@gmail.com` | `1234` |
| Supervisor | `raju@gmail.com` | `1234` |

HR, employee, and wellness expert accounts can be created through the company and user management workflows.
Admin and supervisor passwords can be changed in **Settings → Security** or through password recovery. Those demo passwords are held in backend memory and reset to `1234` whenever the API process restarts.

## Build and test

Build the React app:

```bash
cd front-end/react-app
npm run build
npm run preview
```

Build or test the backend:

```bash
cd back-end
npm run build
npm test
npm run test:e2e
```

## Data and local files

Most platform records are held in backend memory, so restarting the backend resets companies, accounts, consultations, and other application data. Uploaded videos and thumbnails are stored on disk under `back-end/uploads/videos` and `back-end/uploads/thumbnails`; the API serves them from `/media/videos` and `/media/thumbnails`. Logs are written under `back-end/logs`.
