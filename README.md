# Task Manager

A full-stack task manager: React frontend, Flask (Python) API, Azure SQL
Database, deployed to Azure App Service via a GitHub Actions pipeline,
with Azure Application Insights wired in for logging/monitoring.

```
Frontend (React)
      ↓
Backend API (Flask, Python)
      ↓
Database (Azure SQL Database)
      ↓
CI/CD Pipeline (GitHub Actions)
      ↓
Azure App Service
      ↓
Logging + Monitoring (App Insights)
```

Flask serves the built React app as static files and exposes the API
under `/api/*` — one App Service, one deployment, no CORS headaches in
production.

## Project structure

```
task-manager/
├── backend/
│   ├── app.py            # Flask app factory, serves API + React build
│   ├── config.py         # Reads env vars (DB connection, App Insights, port)
│   ├── database.py       # Shared SQLAlchemy instance
│   ├── models.py         # Task model
│   ├── routes.py         # /api/tasks CRUD + filtering/sorting
│   ├── schema.sql        # Azure SQL table definition (run once, manually)
│   ├── requirements.txt
│   ├── startup.sh        # Azure App Service startup command
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx / App.css
│   │   ├── api.js               # fetch wrapper for the backend API
│   │   └── components/
│   │       ├── TaskForm.jsx     # create task
│   │       ├── TaskCard.jsx     # display + inline edit + complete + delete
│   │       ├── TaskList.jsx
│   │       └── FilterBar.jsx    # status filter + sort
│   └── package.json
└── .github/workflows/
    └── deploy.yml         # builds React, merges into Flask static/, deploys
```

## Features

- Create, view, edit, and delete tasks
- Mark a task complete (one click)
- Filter by status (All / Pending / Completed)
- Sort by newest, due date, or priority
- Overdue tasks are visually flagged
- Fields: title, description, priority (Low/Medium/High), status
  (Pending/Completed), due date, created/updated timestamps

## Run locally

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # leave AZURE_SQL_CONNECTION_STRING unset to use local SQLite
python app.py
```

The API runs at http://localhost:8000/api. Local dev uses a SQLite file
(`local_dev.db`) automatically if no Azure SQL connection string is set —
you don't need Azure to develop and test.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Runs at http://localhost:3000 and proxies API calls to the Flask backend
on :8000 (configured via `"proxy"` in `frontend/package.json`).

## Set up Azure resources (one-time)

### 1. Azure SQL Database

1. Create a SQL server + database in the Azure Portal (or `az sql server create` / `az sql db create`).
2. Add a firewall rule allowing Azure services to connect (and your IP, for running the schema script).
3. Open the **Query editor** in the Portal (or connect with Azure Data Studio) and run `backend/schema.sql` once to create the `tasks` table.
4. Grab the ADO.NET/ODBC connection string — you'll set this as `AZURE_SQL_CONNECTION_STRING`.

### 2. Azure App Service

```bash
az login
az group create --name taskmanager-rg --location eastus
az appservice plan create --name taskmanager-plan --resource-group taskmanager-rg --sku B1 --is-linux
az webapp create --resource-group taskmanager-rg --plan taskmanager-plan --name YOUR-UNIQUE-APP-NAME --runtime "PYTHON:3.12"
az webapp config set --resource-group taskmanager-rg --name YOUR-UNIQUE-APP-NAME --startup-file "startup.sh"
```

Set application settings (Configuration > Application settings in the Portal, or via CLI):

```bash
az webapp config appsettings set --resource-group taskmanager-rg --name YOUR-UNIQUE-APP-NAME --settings \
  AZURE_SQL_CONNECTION_STRING="mssql+pyodbc://USER:PASSWORD@YOUR-SERVER.database.windows.net:1433/YOUR-DB?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no" \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

`SCM_DO_BUILD_DURING_DEPLOYMENT=true` tells Azure to run `pip install -r requirements.txt`
automatically after each deploy (via Oryx) — this is what actually
installs Flask, pyodbc, etc. on the server; the GitHub Actions pipeline
just ships the source code.

### 3. Azure Application Insights (optional but included)

1. Create an Application Insights resource in the Portal.
2. Copy its **Connection String**.
3. Add it as an app setting: `APPINSIGHTS_CONNECTION_STRING=...`

If this isn't set, the app runs fine without it — App Insights is a
no-op when the connection string is missing.

### 4. Get the publish profile for GitHub Actions

```bash
az webapp deployment list-publishing-profiles --resource-group taskmanager-rg --name YOUR-UNIQUE-APP-NAME --xml
```

Copy the full XML output.

## Set up the GitHub Actions pipeline

1. In your GitHub repo, go to **Settings > Secrets and variables > Actions**.
2. Add a new repository secret named `AZURE_WEBAPP_PUBLISH_PROFILE` and paste the XML from the step above.
3. Open `.github/workflows/deploy.yml` and replace `your-app-name` with your actual App Service name.
4. Push to `main` — the pipeline will:
   - Build the React app
   - Copy the build into `backend/static`
   - Zip the backend (API + frontend build)
   - Deploy the zip to Azure App Service

You can also trigger it manually from the **Actions** tab (`workflow_dispatch`).

## API reference

| Method | Path                    | Description                          |
|--------|--------------------------|---------------------------------------|
| GET    | `/api/tasks`             | List tasks. Query params: `status`, `priority`, `sort` (`due_date`, `-due_date`, `priority`, `-priority`, `created_at`, `-created_at`) |
| POST   | `/api/tasks`              | Create a task. Body: `title` (required), `description`, `priority`, `status`, `due_date` |
| GET    | `/api/tasks/<id>`         | Get a single task |
| PUT    | `/api/tasks/<id>`         | Update a task (any subset of fields) |
| PATCH  | `/api/tasks/<id>/complete`| Mark a task Completed |
| DELETE | `/api/tasks/<id>`         | Delete a task |
| GET    | `/api/health`             | Health check |

## Notes for future growth

- **Auth**: not included (single-user, per your call). Adding it later means introducing a `users` table, a login flow, and scoping tasks by `user_id`.
- **Categories/tags**: not included yet. Would be a `tags` table + a join table, or a simple comma-separated column if you want to keep it light.
- **Splitting frontend/backend**: if you ever want the React app on its own host (e.g. Azure Static Web Apps) instead of served by Flask, split `deploy.yml` into two jobs and add a CORS origin allowlist in `app.py` (currently wide open with `origins: "*"` since everything's same-origin).
