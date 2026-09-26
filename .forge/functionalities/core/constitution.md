# Project Constitution & Engineering Principles (constitution.md)

**Project:** bishal-travels-invoice-system  
**Governing Standard:** Spec Kit Enterprise SDD Constitution (v2.4.0)  
**Status:** Legally Binding Across All Agents & Developers  
**Effective Date:** 2026-09-26  

---

## Article I: Supreme Architectural Invariants
1. **Clean / Hexagonal Layering:** Domain business logic and core entities MUST remain pure with zero external dependencies (no direct framework or database dependencies).
2. **Ports & Adapters (Dependency Inversion):** All external I/O (REST APIs, databases, message brokers, CLI formatters) MUST interface via typed domain interfaces (Ports).
3. **Deterministic Unidirectional Flow:** Presentation Layer $ightarrow$ Application Services $ightarrow$ Domain Model $leftarrow$ Infrastructure Adapters. Zero circular dependencies.

---

## Article II: Strict Type Safety & Schema Validation
1. **Zero `any` Types:** Codebases MUST maintain 100% strict TypeScript/type definitions. Escape hatches like `any` or unvalidated type assertions (`as unknown as T`) are strictly forbidden.
2. **Runtime Schema Validation:** All incoming HTTP payloads, configuration files, and external DTOs MUST be validated at the boundary using Zod/Valibot schemas before domain ingestion.
3. **Discriminated Unions & Exhaustiveness:** State machines and polymorphic models MUST use discriminated unions with compile-time `never` exhaustiveness checks.

---

## Article III: Resiliency, Fault Tolerance & Concurrency
1. **Idempotency Invariant:** All state-mutating operations MUST accept an `Idempotency-Key` to prevent duplicate side-effects during network retries.
2. **Exponential Backoff with Jitter:** All external network/database retries MUST employ exponential backoff with full randomized jitter:
   $$T_{\text{wait}} = \text{random}(0, \min(T_{\text{max}}, T_{\text{base}} \times 2^{\text{attempt}}))$$
3. **Circuit Breakers:** External third-party dependencies MUST be wrapped in 3-state Circuit Breakers to prevent cascading system failures.
4. **Thread & Async Safety:** Shared state mutations MUST be atomic or protected by mutex locks.

---

## Article IV: Security & Zero-Trust Invariants
1. **Zero Hardcoded Secrets:** Credentials, private keys, and API tokens MUST never be committed to source code or artifacts.
2. **OWASP Top 10 Invariants:** All inputs sanitized, SQL parameterized, cryptographic operations utilize AES-256-GCM / Argon2id, and authorization enforced per request.
3. **Principle of Least Privilege:** Services and agents operate with minimal required permissions.

---

## Article V: Telemetry, Observability & Analytics
1. **Structured JSON Logging:** All log output MUST emit structured JSON with Correlation IDs (`traceId`, `spanId`, `userId`, `timestamp`).
2. **OpenTelemetry Spans:** Service entrypoints and external adapter boundaries MUST record distributed tracing spans and latency histograms.
3. **Immutable Audit Trails:** Financial, state, and security transitions MUST generate immutable audit logs.

---

## Article VI: Test-Driven Development (TDD) & Quality Gates
1. **Minimum 90% Code Coverage:** Core domain logic and scoring algorithms MUST maintain $>90\%$ branch and path coverage.
2. **Mandatory Edge-Case Tests:** Every user story MUST have negative tests asserting boundary conditions, network timeouts, and malformed inputs.
3. **Agent Compliance:** Downstream agents (`/specify`, `/architecture`, `/tasks`, `/implement`, `/review`) MUST uphold these constitutional invariants.
