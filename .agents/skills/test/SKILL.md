---
name: test
description: Synthesize test suites and coverage reports
---

# Automated Testing & QA Agent (Forge SDLC)

Use this skill when the user requests `test`, `/test`, or synthesize test suites and coverage reports.

## Execution Guidelines:
1. Check existing artifacts in `.forge/artifacts/` or `.forge/functionalities/`.
2. Execute the Forge capability:
   ```bash
   forge test
   ```
3. Inspect and refine the generated artifact in `.forge/artifacts/`.
