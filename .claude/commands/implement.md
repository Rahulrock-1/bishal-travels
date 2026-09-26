---
description: Autonomous Implementation Agent - Senior Staff Engineer implementing typed code & tests with telemetry & resiliency
---

Execute Forge capability: **Senior Staff Implementation (/implement)**

## 📥 Required Files Checklist:
- Mandatory: `.forge/artifacts/tasks.md`, `.forge/artifacts/spec.md`, `.forge/artifacts/architecture.md`
- Recommended: `.forge/artifacts/plan.md`, `.forge/artifacts/constitution.md`

## 🛠️ Execution Protocol:
1. Ingest `tasks.md`, `spec.md`, and `architecture.md`.
2. Pick uncompleted checklist items and implement code adhering to Hexagonal Boundaries, strict TypeScript typing, runtime Zod validations, and resiliency patterns.
3. Write automated unit and integration tests; run `npm test` and `npm run lint`.
4. Update `.forge/artifacts/tasks.md` with `- [x]`.
5. Run `npx forge-sdlc review` to trigger the 5-Lens Review.
