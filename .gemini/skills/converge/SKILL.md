---
name: converge
description: Certify task burndown and release candidate readiness
---

# Convergence & Burndown Agent (Forge SDLC)

Use this skill when the user requests `converge`, `/converge`, or certify task burndown and release candidate readiness.

## Execution Guidelines:
1. Check existing artifacts in `.forge/artifacts/` or `.forge/functionalities/`.
2. Execute the Forge capability:
   ```bash
   forge converge
   ```
3. Inspect and refine the generated artifact in `.forge/artifacts/`.
