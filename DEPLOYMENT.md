# 🚀 Bishal Travels - Supabase PostgreSQL & Render Cloud Deployment Guide

This guide details how to deploy the **Bishal Travels .NET 8 Web API** to **Render** and connect it to a managed **Supabase PostgreSQL** database, followed by pointing the frontend to the deployed cloud API.

---

## Part 1: Setup Supabase PostgreSQL Database

1. **Create or Log into Supabase**:
   - Go to [https://supabase.com](https://supabase.com) and click **Start your project**.
   - Create a new project named `bishal-travels-db`.
   - Set a strong database password (keep this password handy!).
   - Select the nearest region (e.g. `Singapore - ap-southeast-1` or `Mumbai - ap-south-1`).

2. **Run the Database Schema Script**:
   - In your Supabase dashboard, click **SQL Editor** from the left navigation.
   - Click **New Query**.
   - Open and copy the entire contents of [`backend/Supabase_Schema.sql`](file:///D:/Invoice%20System/backend/Supabase_Schema.sql).
   - Paste into the SQL Editor and click **Run**.
   - All tables (`company_profiles`, `vehicles`, `clients`, `duty_slips`, `invoices`, `invoice_items`, `users`), indexes, and default Bishal Travels initial records will be created instantly.

3. **Get your Connection String**:
   - In Supabase, go to **Project Settings** (gear icon) $\rightarrow$ **Database**.
   - Scroll down to **Connection parameters** or **Connection string**.
   - Under **URI** or **Connection String**, select **Nodejs** or **URI**:
     - Format: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
     - Or standard ADO.NET format:
       `Host=aws-0-[REGION].pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.[PROJECT-REF];Password=[YOUR-PASSWORD];SSL Mode=Require;Trust Server Certificate=true;`

---

## Part 2: Deploy Backend to Render (via GitHub or Docker)

Render supports automated deployment directly from your GitHub repository using the included [`render.yaml`](file:///D:/Invoice%20System/render.yaml) or via the Render Web UI.

### Option A: 1-Click / Blueprint Deployment (Recommended)
1. Push your repository to GitHub (`master` or `main` branch).
2. Go to [https://dashboard.render.com](https://dashboard.render.com) $\rightarrow$ **Blueprints** $\rightarrow$ **New Blueprint Instance**.
3. Select your GitHub repository (`Rahulrock-1/bishal-travels`).
4. Render will detect `render.yaml` automatically.
5. In the environment variable setup:
   - Key: `ConnectionStrings__DefaultConnection`
   - Value: Paste your Supabase connection string.
6. Click **Apply**. Render will automatically build the multi-stage Docker image and deploy.

### Option B: Manual Web Service Setup
1. On [Render Dashboard](https://dashboard.render.com), click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository.
3. Choose **Docker** runtime:
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: `backend`
   - **Instance Type**: Free (or Starter)
4. Add Environment Variables:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ConnectionStrings__DefaultConnection`: `<YOUR_SUPABASE_POSTGRES_CONNECTION_STRING>`
5. Click **Create Web Service**.

### Health Check & API Verification
- Once deployed, your backend will receive an onrender.com URL (e.g., `https://bishal-travels-api.onrender.com`).
- Check health: `https://bishal-travels-api.onrender.com/health` (should return HTTP 200 `{"status": "Healthy"}`).
- Interactive Swagger Documentation: `https://bishal-travels-api.onrender.com/swagger`

---

## Part 3: Connect the Frontend to the Deployed API

1. In the root directory or in your frontend hosting environment (Vercel / Netlify / Render Static), set the environment variable:
   ```env
   VITE_API_URL=https://bishal-travels-api.onrender.com/api
   ```
2. Build and run locally or deploy:
   ```bash
   npm run build
   ```
3. The application will connect directly to your .NET Web API and Supabase PostgreSQL database, with automatic offline LocalStorage fallback whenever internet connectivity is unavailable!
