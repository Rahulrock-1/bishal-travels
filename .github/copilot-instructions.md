# Forge SDLC - AI Editor Custom Instructions (Senior Staff / Principal Level)

When working in this repository, you have access to the **Forge SDLC Capability Pipeline**:

## 📋 Agent File Dependency & Ingestion Matrix (15 Stages):
- `/sdlc` / `/workflow`: Master SDLC Orchestrator — executes the complete 15-stage pipeline.
- `/brainstorm` (or `/ideate`): Brainstorm & Lateral Ideation (`brainstorm.md`) via BMAD.
- `/heal` (or `/drift`): Cross-Artifact Auto-Healing & Drift Sync (`healing-plan.md`) via Internal.
- `/swarm`: Multi-Provider Swarm Consensus Engine (BMAD + SpecKit + Internal).
- `/brd`: Business Requirements & ROI Model (`brd.md`) via BMAD.
- `/constitution`: Non-negotiable architectural & security invariants (`constitution.md`) via Spec Kit.
- `/specify`: Given-When-Then functional specification (`spec.md`) via Spec Kit. **Requires:** `constitution.md`.
- `/clarify`: Probes ambiguities & edge cases (`clarifications.md`) via BMAD.
- `/architecture`: C4 System Architecture & ADRs (`architecture.md`) via BMAD. **Requires:** `spec.md`, `constitution.md`.
- `/plan`: Phased technical roadmap (`plan.md`) via Spec Kit. **Requires:** `spec.md`, `architecture.md`.
- `/tasks` (or `/task`): Atomic task checklist (`tasks.md`) via Spec Kit. **Requires:** `plan.md`, `spec.md`, `constitution.md`.
- `/analyze`: Cross-artifact consistency & drift analytics (`analysis.md`) via Spec Kit. **Requires:** `spec.md`, `tasks.md`.
- `/implement`: Autonomous Implementation Agent — **Requires:** `tasks.md`, `spec.md`, `architecture.md`, `constitution.md`. Implements typed code, DDD patterns, resiliency & tests.
- `/test`: Automated unit/integration test suites (`test-report.md`) via Internal. **Requires:** Source code in `src/`.
- `/review`: 5-Lens code review (`review.md`) via BMAD. **Requires:** Source code, `architecture.md`, `constitution.md`.
- `/security`: STRIDE & OWASP SAST Threat Audit (`security-audit.md`) via Forge Internal.
- `/converge`: Task burndown and release readiness certification (`convergence.md`) via Spec Kit.
- `/release`: KeepAChangelog notes and SemVer release notes (`CHANGELOG.md`, `RELEASE_NOTES.md`).

Artifacts are located in `.forge/artifacts/` and `.forge/functionalities/<feature>/`. Always align implementations with these artifacts.
