---
name: release
description: KeepAChangelog notes and SemVer release notes
---

# Release Packaging Agent (Forge SDLC)

Use this skill when the user requests `release`, `/release`, or keepachangelog notes and semver release notes.

## Execution Guidelines:
1. Check existing artifacts in `.forge/artifacts/` or `.forge/functionalities/`.
2. Execute the Forge capability:
   ```bash
   forge release
   ```
3. Inspect and refine the generated artifact in `.forge/artifacts/`.
