# React Team Instructions

This folder contains the React migration of the Stack Builders Wellness frontend.

## Before changing code

- Read `CONTRIBUTING.md`.
- Confirm the assigned role and branch with the teammate.
- Do not modify the existing HTML/CSS/JavaScript frontend outside this folder.
- Do not modify backend files unless the task explicitly belongs to API integration.

## Ownership

- Person 1 owns `src/App.jsx`, `src/main.jsx`, `src/components/`, `src/layouts/`, and `src/styles/`.
- Employee work belongs in `src/features/employee/`.
- HR work belongs in `src/features/hr/`.
- Expert work belongs in `src/features/expert/`.
- Admin and Superadmin work belongs in `src/features/admin/`. Superadmin is an Admin permission level, not a separate actor.
- Supervisor work belongs in `src/features/supervisor/`.

The project has five actors: Employee, HR, Expert, Admin, and Supervisor. Keep Superadmin-specific screens and permissions inside the Admin feature unless the team agrees on a separate module later.

## Change rules

- Reuse shared components instead of creating duplicates.
- Keep each change focused and working.
- Stage only files owned by the current feature branch.
- Do not use `git add .` when unrelated work is present.
- Ask Person 1 before changing shared components, routes, or global styles.
- Test the React app with `npm run dev` before opening a pull request.

## Git workflow

```cmd
git switch main
git pull --rebase origin main
git switch -c react/your-role
git add src/features/your-role
git commit -m "Describe the role feature"
git push -u origin react/your-role
```

Open a pull request into `main`. Do not push directly to `main`.
