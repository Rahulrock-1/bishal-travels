# Spec Kit Structured Clarification Log

**Project:** bishal-travels-invoice-system  
**Date:** 2026-09-26T06:45:41.981Z  

---

| Item ID | Question / Ambiguity | Decision / Resolution | Impacted Artifacts |
| :--- | :--- | :--- | :--- |
| **CLR-01** | Should `forge` support interactive terminal wizards? | Yes, interactive mode prompts users when required arguments are omitted. | `cli/app.ts`, `cli/ui/prompts.ts` |
| **CLR-02** | Where should project artifacts be stored? | Defaults to `.forge/artifacts/` or project root if configured. | `engine/artifacts.ts` |
| **CLR-03** | How should multi-agent workflows pass intermediate state? | Via standard Markdown artifacts with YAML frontmatter metadata. | `types/artifact.ts` |
