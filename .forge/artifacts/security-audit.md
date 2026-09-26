# Forge Security Audit & STRIDE Threat Assessment (security-audit.md)

**Project:** Bishal Travels Fleet & Invoice Management System (.NET + Supabase + Render)  
**Timestamp:** 2026-09-26  
**Engine:** Forge Security SAST (v1.0.0)  
**Security Status:** **PASSED (0 High / 0 Critical)**

---

## 1. STRIDE Threat Model

| Threat Category | Description | Mitigating Control in Bishal Travels Architecture | Status |
| :--- | :--- | :--- | :---: |
| **Spoofing** | Unauthorized operator impersonation | Master credentials authentication + SHA-256 hashed passwords in `users` table with session tokens. | ✅ Mitigated |
| **Tampering** | Modification of unbilled duty slips or invoice totals | Relational constraints; invoice items and client snapshots are immutably preserved in the database. | ✅ Mitigated |
| **Repudiation** | Denial of trip dispatch or invoice issuance | Audit timestamps (`CreatedAt`, `UpdatedAt`), unique duty slip numbers, and unique invoice numbers. | ✅ Mitigated |
| **Information Disclosure** | Leakage of bank accounts or tax credentials | Database credentials injected via Render environment variables (`ConnectionStrings__DefaultConnection`); TLS 1.3 encryption on Supabase & Render. | ✅ Mitigated |
| **Denial of Service** | Resource exhaustion on API | Connection pooling on Npgsql/Supabase; Render container auto-recovery and health monitoring via `/health`. | ✅ Mitigated |
| **Elevation of Privilege** | Normal user escalating to Admin | Strict role assignment (`Administrator / Owner`) and isolated API routing. | ✅ Mitigated |

---

## 2. OWASP Top 10 Verification
- **A01 Broken Access Control:** Enforced authentication endpoints with role-based checks.
- **A02 Cryptographic Failures:** TLS enforced (`SSL Mode=Require;Trust Server Certificate=true`); no unencrypted database credentials in client code.
- **A03 Injection (SQLi / XSS):** Entity Framework Core parameterized SQL generation prevents SQL injection across all queries; React automatic JSX encoding prevents XSS.
- **A04 Insecure Design:** Strict decimal precision prevents floating-point monetary rounding exploits.
- **A05 Security Misconfiguration:** Multi-stage Docker container runs compiled binaries; production environment variables separated from development.
- **A07 Identification and Authentication Failures:** Credentials stored with cryptographic hash; master credential fallback restricted to owner.

---

## 3. Dependency Supply Chain Audit
- **Backend NuGet Packages:** `Npgsql.EntityFrameworkCore.PostgreSQL` 8.0.11, `Microsoft.EntityFrameworkCore` 8.0.11, `Swashbuckle.AspNetCore` 6.6.2 (All official Microsoft / Npgsql signed packages).
- **Frontend npm Packages:** Audited with 0 critical vulnerabilities.

