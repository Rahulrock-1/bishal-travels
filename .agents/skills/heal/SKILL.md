---
name: heal
description: Audit drift across spec, architecture, and tasks, auto-generating surgical patches (healing-plan.md)
---

# Cross-Artifact Auto-Healing & Drift Sync Agent (Forge SDLC)

Use this skill when the user requests `/heal`, `heal`, `drift`, or asks to audit requirement drift and auto-patch artifacts.

## 🩺 Auto-Healing Protocol:
1. Ingest `spec.md`, `architecture.md`, `tasks.md`, and `constitution.md`.
2. Compute mathematical requirement-to-task traceability coverage.
3. Identify orphaned requirements, rogue tasks, and architectural gaps.
4. Synthesize surgical patch checklist into `.forge/artifacts/healing-plan.md`.
5. Run `forge heal --apply` to automatically patch `tasks.md`.
