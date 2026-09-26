# Developer Tasks Breakdown (tasks.md)

**Project:** bishal-travels-invoice-system  
**Status:** Ready for Execution  

---

## Phase 1: Core Abstractions & Capability Catalog
- [x] **Task 1.1:** Define TypeScript interfaces for Capabilities, Providers, Artifacts, and Scoring.  
  *Files:* `src/types/index.ts`  
  *Verification:* `npm run lint` passes with 0 errors.

- [x] **Task 1.2:** Implement 30+ generic SDLC capability manifests across 7 SDLC groups.  
  *Files:* `src/catalog/capabilities.ts`  
  *Verification:* All manifests have valid input/output specs and provider bindings.

## Phase 2: Scoring & Recommendation Engine
- [x] **Task 2.1:** Implement `ScoringEngine` with multi-factor weighted formula.  
  *Files:* `src/scoring/engine.ts`  
  *Verification:* Unit tests verify score calculation and rank sorting.

- [x] **Task 2.2:** Implement `generateWhyExplanation` and alternative condition reasoning.  
  *Files:* `src/scoring/explainer.ts`  
  *Verification:* Explanations output clear bullet points and trade-off triggers.

## Phase 3: Provider Adapters & Execution
- [x] **Task 3.1:** Implement BMAD Provider Adapter for Architecture and Multi-Lens Review.  
  *Files:* `src/providers/bmad.ts`  
  *Verification:* Generates `architecture.md` and `review.md`.

- [x] **Task 3.2:** Implement Spec Kit Provider Adapter for SDD, Plan, Tasks, and Converge.  
  *Files:* `src/providers/speckit.ts`  
  *Verification:* Generates `spec.md`, `plan.md`, `tasks.md`, `analysis.md`, `convergence.md`.

- [x] **Task 3.3:** Implement Forge Internal Provider Adapter for Security, Testing, and Deployment.  
  *Files:* `src/providers/internal.ts`  
  *Verification:* Generates security and test artifacts.

## Phase 4: CLI Application & Interactive TUI
- [ ] **Task 4.1:** Build CLI commands (`forge <capability>`, `recommend`, `matrix`, `workflow`, `skills`, `init`).  
  *Files:* `src/cli/`, `src/bin.ts`  
  *Verification:* `npx forge-sdlc recommend` displays full visual matrix.
