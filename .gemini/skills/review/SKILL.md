---
name: review
description: 5-Perspective code review (bmad-review)
---

# Multi-Lens Review Agent (Forge SDLC)

Use this skill when the user requests `review`, `/review`, or 5-perspective code review (bmad-review).

## Execution Guidelines:
1. Check existing artifacts in `.forge/artifacts/` or `.forge/functionalities/`.
2. Execute the Forge capability:
   ```bash
   forge review
   ```
3. Inspect and refine the generated artifact in `.forge/artifacts/`.
