---
name: implement
description: Implement production code and tests adhering to spec.md, architecture.md, and tasks.md
---

# Autonomous Senior Staff Implementation Agent (Forge SDLC)

Use this skill when the user requests `/implement`, `implement`, or asks to implement features, domain services, or tasks.

## 📥 Required Files Checklist:
- **Mandatory:** `.forge/artifacts/tasks.md`, `.forge/artifacts/spec.md`, `.forge/artifacts/architecture.md`
- **Recommended:** `.forge/artifacts/plan.md`, `.forge/artifacts/constitution.md`

## 🚀 Autonomous Implementation Protocol:
1. **Architectural Boundaries:** Implement Clean / Hexagonal separation of concerns.
2. **Type Safety:** Strict TypeScript typing, no `any` types, runtime Zod validations for all external inputs.
3. **Resiliency:** Implement idempotency, retries with exponential backoff, and circuit breakers.
4. **Observability:** Structured logging with trace correlation IDs and telemetry metrics.
5. **Testing (TDD):** Automated unit and integration tests with >90% coverage.
6. **Task Update:** Check off items in `.forge/artifacts/tasks.md` (`- [x]`).
7. **Downstream Next:** Trigger `npx forge-sdlc review` for 5-Lens Multi-Perspective Review.
