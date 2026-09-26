---
name: swarm
description: Execute BMAD, Spec Kit, and Internal concurrently, synthesizing consensus-weighted findings
---

# Multi-Provider Swarm Consensus Agent (Forge SDLC)

Use this skill when the user requests `/swarm`, `swarm`, or asks for multi-agent consensus verification across BMAD, Spec Kit, and Internal engines.

## 🐝 Swarm Consensus Protocol:
1. Execute multiple candidate providers (BMAD, Spec Kit, Internal) concurrently for the target capability.
2. Ingest independent verdicts and calculate mathematical consensus agreement percentage.
3. Synthesize unified findings into `.forge/artifacts/swarm-<capability>.md`.
