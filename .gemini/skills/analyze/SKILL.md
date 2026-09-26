---
name: analyze
description: Audit consistency across spec, arch, and tasks
---

# Cross-Artifact Analysis Agent (Forge SDLC)

Use this skill when the user requests `analyze`, `/analyze`, or audit consistency across spec, arch, and tasks.

## Execution Guidelines:
1. Check existing artifacts in `.forge/artifacts/` or `.forge/functionalities/`.
2. Execute the Forge capability:
   ```bash
   forge analyze
   ```
3. Inspect and refine the generated artifact in `.forge/artifacts/`.
