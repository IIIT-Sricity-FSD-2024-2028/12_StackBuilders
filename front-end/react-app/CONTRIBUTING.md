# React Team Workflow

## Setup

From this folder, install dependencies and start the development server:

```cmd
npm install
npm run dev
```

## Feature ownership

Each person works in one feature folder:

| Role | Folder | Branch |
| --- | --- | --- |
| Employee | `src/features/employee` | `react/employee` |
| HR | `src/features/hr` | `react/hr` |
| Expert | `src/features/expert` | `react/expert` |
| Admin | `src/features/admin` | `react/admin` |
| Superadmin | `src/features/superadmin` | `react/superadmin` |
| Supervisor | `src/features/supervisor` | `react/supervisor` |

## Shared files

Person 1 owns the shared foundation. Coordinate before editing:

- `src/App.jsx`
- `src/main.jsx`
- `src/components/`
- `src/layouts/`
- `src/styles/global.css`

Feature work should stay inside the assigned `src/features/<role>/` folder.

## Branch workflow

Start from the latest main branch:

```cmd
git switch main
git pull --rebase origin main
git switch -c react/your-role
```

Commit only your feature files:

```cmd
git add src/features/your-role
git commit -m "Build your role dashboard"
git push -u origin react/your-role
```

Open a pull request into `main`. Do not push directly to `main`.

## Shared component requests

If a feature needs a shared component, describe the required props in the pull request. Person 1 can update the shared component without multiple people editing it at once.
