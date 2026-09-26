---
description: Inspect code and dependencies for OWASP vulnerabilities, injection vectors, hardcoded secrets, unsafe deserialization, and auth bypasses.
---

Execute Forge capability: **Security Audit & Vulnerability Assessment**
- Required Inputs: existing_codebase, threat-model.md
- Target Output: `.forge/artifacts/security-audit.md`

Run: `npx forge-sdlc security`
