# Release Notes - v2.0.0

🎉 **Welcome to Bishal Travels Fleet & Invoice Management System v2.0.0!**

This major release elevates Bishal Travels from a browser-only application into an enterprise-grade cloud system powered by an **ASP.NET Core 8 Web API**, a managed **Supabase PostgreSQL** database, containerized deployment on **Render**, and seamless full-stack **React** integration.

### 🌟 Key Highlights
- **ASP.NET Core 8 Web API:** High-throughput, clean architecture REST API covering all operations: Company Profile & Bank details, Vehicle Fleet, Corporate Client CRM, Daily Duty Slips, Monthly GST Invoices, and Analytics.
- **Supabase PostgreSQL Database:** Fully relational schema with decimal precision arithmetic, foreign key safety, and an instant execution script ([`backend/Supabase_Schema.sql`](file:///D:/Invoice%20System/backend/Supabase_Schema.sql)).
- **Turnkey Render Cloud Deployment:** Ready-to-deploy multi-stage Dockerfile and [`render.yaml`](file:///D:/Invoice%20System/render.yaml) specification with automated health checks (`/health`).
- **Resilient Full-Stack Integration:** React UI synchronizes with the cloud API while maintaining a complete offline LocalStorage fallback with live connection indicators.
- **100% Automated Test Pass Rate:** Verified with 9 xUnit tests and clean production Vite bundle compilation.

