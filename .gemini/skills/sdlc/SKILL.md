---
name: sdlc
description: Execute end-to-end 14-stage SDLC workflow from discovery to release
---

# Full SDLC Master Orchestrator (Forge SDLC)

Use this skill when the user requests `/sdlc`, `/workflow`, or asks to run the complete end-to-end SDLC pipeline.

## Master SDLC Pipeline Execution:
Execute the full 13-stage sequential SDLC with functionality folder organization:
1. `forge brd` (Business Requirements Document)
2. `forge specify` (Given-When-Then Specification)
3. `forge clarify` (Ambiguity Elicitation)
4. `forge architecture` (C4 Architecture & ADRs)
5. `forge plan` (Milestone Roadmap)
6. `forge tasks` (Task Decomposition Checklist)
7. `forge analyze` (Cross-Artifact Drift Analysis)
8. `forge implement` (Autonomous Code & Test Implementation)
9. `forge test` (Automated Test Verification)
10. `forge review` (5-Lens Multi-Perspective Code Review)
11. `forge security` (STRIDE & OWASP Security Audit)
12. `forge converge` (Task Burndown & Release Readiness)
13. `forge release` (KeepAChangelog & Release Notes)

Fast CLI run: `npx forge-sdlc sdlc --functionality core`
