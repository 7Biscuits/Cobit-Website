# CoBit — Skills Before College & Student Projects Showcase

Interactive 3D city experience powered by **Three.js** with a dynamic **Our Projects** showcase backed by **Supabase**.

---

## Architecture Overview

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5 semantic markup, CSS3 custom properties, and Three.js (r128).
- **Backend / Database**: Supabase (PostgreSQL, Storage, and Authentication with Row Level Security).
- **Environment Configuration**: Environment variables loaded from `.env` via a lightweight, zero-dependency Node configuration manager.
- **Admin Portal**: Dedicated private admin portal accessible directly at `/admin` (no public links or buttons).

---

## Environment Variables Reference

All project configuration is centralized in environment variables. Variables are split into **Client-Safe (Public)** and **Server-Only (Privileged)**.

### 1. Client-Safe Public Variables (Exposed to Browser)
These variables are safe to be read by the client-side browser runtime. Data access is strictly protected by Supabase Row Level Security (RLS) policies on the database.

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `SUPABASE_URL` | **Yes** | `https://your-project-id.supabase.co` | Your Supabase project REST and API endpoint. |
| `SUPABASE_ANON_KEY` | **Yes** | `eyJ...` (JWT Token) | Supabase public anon key. Safe for client-side usage because Row Level Security (RLS) enforces access control. |
| `OVERALL_ADMIN_EMAIL` | **Yes** | `admin@cobit.example` | Root administrator email with exclusive privileges to approve or reject new admin accounts. |
| `STORAGE_BUCKET_NAME` | No | `project-media` | Public Supabase Storage bucket used for project covers and proof-of-work screenshots. |

### 2. Server-Only Privileged Secrets (NEVER Exposed to Browser)
These variables contain privileged credentials. They must **never** be included in client-side bundles or scripts.

| Variable Name | Required | Example | Purpose & Security Constraint |
| :--- | :---: | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | No (Backend only) | `your-service-role-key` | **Bypasses all Row Level Security.** Strictly for server-side scripts, database seeders, or background tasks. |
| `DATABASE_URL` | No (Backend only) | `postgresql://postgres:...` | Direct PostgreSQL connection string for CLI migrations or database administrator tools. |
| `PORT` | No | `3000` | Port for the local development server. |

---

## Local Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (Node 20+ recommended). Zero third-party npm dependencies are required.

### 1. Configure Environment Variables
Copy the `.env.example` template to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase project credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key-here
OVERALL_ADMIN_EMAIL=admin@cobit.example
STORAGE_BUCKET_NAME=project-media
PORT=3000
```

### 2. Start the Local Server
Run the built-in development server:
```bash
npm start
# or: node server.js
```
The server will automatically:
1. Parse `.env` and generate the client-safe configuration at `js/env-config.js`.
2. Launch the HTTP server at `http://localhost:3000/`.
3. Provide clean URL routing for `/admin`.
4. Strictly protect sensitive files (`.env`, `.git`, server files) with `HTTP 403 Forbidden`.

Open your browser:
- **Public Showcase**: `http://localhost:3000/`
- **Admin Portal**: `http://localhost:3000/admin`

### 3. Alternative: Static Server (e.g., Live Server, Python, Nginx)
If you prefer running a static server (like `python3 -m http.server` or VS Code Live Server):
1. Generate the client configuration file manually:
   ```bash
   npm run config
   # or: node scripts/generate-env.js
   ```
2. Start your static file server. The browser will read `js/env-config.js` directly.

---

## Deployment Configuration

### Deploying to Vercel
1. Import or link your repository in [Vercel](https://vercel.com).
2. The project includes a pre-configured [`vercel.json`](file:///Users/rudranshsrivastava/Programming/cobit-main/vercel.json) that automatically handles:
   - Build command (`npm run build`)
   - Clean URL routing & rewrites for `/admin`
   - Cache control and security headers
3. In **Project Settings** > **Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OVERALL_ADMIN_EMAIL` (optional, defaults to `admin@cobit.example`)
   - `STORAGE_BUCKET_NAME` (optional, defaults to `project-media`)
4. Click **Deploy**. Vercel will run the build step to generate `js/env-config.js` with client-safe variables and serve your platform instantly.

### Deploying to Netlify
1. Link your repository in Netlify.
2. Under **Site configuration** > **Environment variables**, set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OVERALL_ADMIN_EMAIL`
   - `STORAGE_BUCKET_NAME`
3. Set Build Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.`
4. Deploy site.

### Deploying to Cloudflare Pages / GitHub Pages
For static hosts:
1. Run the build step in your CI/CD pipeline:
   ```bash
   npm run build
   ```
2. Deploy the resulting directory. `js/env-config.js` is created as part of the build step from your CI/CD environment variables.

### Deploying to Docker / Node Server
A `Dockerfile` can simply run:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Security Model & Best Practices

1. **Row Level Security (RLS)**:
   - The public anon key (`SUPABASE_ANON_KEY`) is safe to be exposed in the browser because Postgres Row Level Security policies enforce permissions:
     - Unauthenticated/Public visitors: Can only `SELECT` projects where `is_published = true`.
     - Logged-in & Verified Admins: Can `INSERT`, `UPDATE`, and `DELETE` projects and upload to `project-media`.
     - Overall Admin (`OVERALL_ADMIN_EMAIL`): Can verify, reject, or revoke other admin accounts in `admin_profiles`.
2. **Never Expose Privileged Secrets**:
   - `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It is **never** outputted to `js/env-config.js` or sent to the browser.
   - `scripts/generate-env.js` and `server.js` enforce strict allowlists of public variables and actively strip any privileged keys.
3. **Version Control Protection**:
   - `.env` and `js/env-config.js` are listed in `.gitignore` to prevent credentials from being committed to GitHub.
