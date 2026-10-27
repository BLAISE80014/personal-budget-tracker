# React + Vite

## Production deployment

This repository uses a separate frontend and API deployment:

- **Frontend:** Vercel (Vite static site)
- **API:** Render web service (Express, configured by [`render.yaml`](./render.yaml))
- **Database:** MongoDB Atlas

### 1. Deploy the frontend to Vercel

Import this GitHub repository into Vercel. Use the repository root as the project root, `npm run build` as the build command, and `dist` as the output directory. The Vercel project uses `vercel.json` to route client-side paths to the React app.

The API URL is not known until the Render service is created. After that, add this Vercel environment variable and redeploy:

```text
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

Do not include a trailing slash after `/api`.

### 2. Prepare MongoDB Atlas

Create a production database and database user in Atlas. Copy its application connection string, using `personal-budget-tracker` as the database name. Store the complete URI only as the Render `MONGODB_URI` secret; do not commit it or put it in the Vite environment.

Allow network access from the Render service using the outbound IP addresses available for your Render plan. If you choose Atlas's broad `0.0.0.0/0` network rule, understand that it permits connection attempts from any IP and rely on a strong, unique database password and TLS; prefer restricted access when your Render plan supports it.

### 3. Deploy the API to Render

In Render, create a Blueprint deployment from this repository and select `render.yaml`. Set the prompted environment values:

- `MONGODB_URI`: Atlas connection string for the production database.
- `CORS_ORIGINS`: exact Vercel site origin, for example `https://your-project.vercel.app` (origins only; no path or trailing slash). Comma-separate additional trusted origins if needed.
- `FRONTEND_URL`: exact Vercel site origin, used to build password-reset links.
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: production SMTP credentials and sender identity for password-reset emails.

Render generates `JWT_SECRET` automatically. Keep all secrets in Render's environment settings. The API listens on Render's provided `PORT`; the health check is `/api/health`.

### 4. Connect and verify

After the API deploys, set `VITE_API_URL` in Vercel to the Render service URL ending in `/api`, then redeploy the frontend. Open `https://<your-render-service>.onrender.com/api/health`; it should report `"status":"ok"` and `"database":"connected"`. Verify registration/login, data persistence, and password reset from the deployed Vercel site.

The local `.env` is for development only and must never be uploaded to Vercel or committed. Production and local databases should remain separate.

### Deployment notes

- The free Render web-service plan may sleep when idle, so the first API request after inactivity can take longer.
- Update `CORS_ORIGINS` and `FRONTEND_URL` if the Vercel production domain changes.
- Vercel preview domains are not trusted automatically; add only the specific preview origins you intend to use.

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:
![image alt](https://github.com/BLAISE80014/personal-budget-tracker/blob/e1157c87d60fca5ad6d78623d61afebbe4a54409/Screenshot%202026-10-07%20091919.png)

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Password reset email setup

Copy `.env.example` to `.env` and configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` with credentials from your SMTP provider. Use port `465` for implicit TLS or `587` for STARTTLS. Set `FRONTEND_URL` to the origin where the React app is served; use an HTTPS URL in production. Restart the backend after changing environment variables.

## Administrator setup

Public registration always creates a regular user account. Copy `.env.example` to `.env`, then set `ADMIN_EMAIL` to the email of the existing account you explicitly choose to make the initial administrator. Do not enter an email here unless you intend to grant that account administrator access. Keep `.env` private and never commit it.

Register that account normally, set `ADMIN_EMAIL` in the server's `.env`, and run:

```sh
npm run admin:setup
```

The command requires `MONGODB_URI` to point to the intended database and only provisions the account matching `ADMIN_EMAIL`. It never creates an account, changes a password, or selects a different email. Re-running against the already-provisioned account is safe; a different existing administrator causes setup to stop without changing roles.

If an administrator is already provisioned and you intentionally want to transfer administrator access to another existing account, first set `ADMIN_EMAIL` to the destination account's email, then explicitly run:

```sh
npm run admin:migrate -- --from=<current-admin-email> --confirm
```

The destination account must already exist, and `--from` must identify the sole current administrator. The migration preserves both accounts and their passwords, transfers the stored administrator role, updates the protected initial-admin marker, and records the changes. It does not run automatically when `ADMIN_EMAIL` changes. If interrupted, rerun the same command to resume; a completed migration is not repeated.

Administrators sign in at `/admin/login` and use `/admin/dashboard`; regular users continue to use `/login` and `/dashboard`. The admin APIs independently verify the account role stored in MongoDB. Existing accounts without a stored role are assigned the regular `user` role when the backend starts; no account is automatically promoted. The backend also requires `JWT_SECRET` for signed sessions.

The protected admin workspace includes MongoDB-backed account summaries, date-filtered platform analytics, searchable and paginated user and financial-record lists, role-change audit history, and administrator notifications. Financial records are read-only in the admin workspace. Account activation status is not currently represented in the user model, so the dashboard reports it as untracked rather than implying an account state. Currency formatting follows the signed-in administrator's preference and does not convert stored amounts.

Authenticated users can manage their own tasks from `/tasks`; the backend exposes `GET` and `POST /api/tasks`, `GET` and `PATCH /api/tasks/:taskId`, and `DELETE /api/tasks/:taskId`. Every operation is scoped to the authenticated user. Reminder dates are stored with tasks, but automatic delivery is not configured because the application does not currently run a reminder scheduler.

If SMTP password-reset email is unavailable, reset the configured administrator password from a private interactive terminal with:

```sh
npm run admin:password
```

This requires `ADMIN_EMAIL` and `MONGODB_URI`; it prompts twice without echoing the password, updates only the matching existing administrator, and revokes that account's existing sessions. It does not display, log, or change the password unless the confirmation matches.

The integration tests require `TEST_MONGODB_URI` to point to a dedicated test database whose name contains `test`; they never use `MONGODB_URI` as a fallback. Run them with:

```sh
npm test
```
