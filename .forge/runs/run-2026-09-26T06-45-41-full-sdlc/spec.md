# Software Specification Document (spec.md)

**Feature / System:** bishal-travels-invoice-system  
**Format:** Spec Kit Spec-Driven Development (SDD)  
**Status:** In Review  
**Date:** 2026-09-26  

---

## 1. Problem Statement & User Value
Developers using AI coding frameworks are locked into single vendor ecosystems (e.g. all-BMAD or all-SpecKit). They need a universal capability router that dynamically selects and orchestrates the best specialized provider for each SDLC stage while maintaining a single, consistent CLI and artifact pipeline.

---

## 2. User Stories & Acceptance Criteria

### User Story 1: Capability-Based CLI Execution
> **As a** developer  
> **I want to** run `forge architecture` or `forge specify`  
> **So that** I get the best tool for the job without knowing underlying provider commands.

#### Acceptance Scenarios (Given-When-Then)
- **Scenario 1.1:** Default Recommended Execution
  - **Given** I am in a project directory
  - **When** I run `forge architecture`
  - **Then** Forge scores candidate providers and executes BMAD Architecture
  - **And** generates `architecture.md` in the project artifacts directory.

- **Scenario 1.2:** Explicit Provider Override
  - **Given** I want to enforce a specific provider
  - **When** I run `forge architecture --provider speckit`
  - **Then** Forge bypasses recommendation and executes Spec Kit Plan.

### User Story 2: Explainable Recommendation Mode
> **As a** tech lead  
> **I want to** run `forge recommend`  
> **So that** I see why each provider was selected and when to use alternatives.

#### Acceptance Scenarios
- **Scenario 2.1:** Full Workflow Recommendation Matrix
  - **When** I run `forge recommend`
  - **Then** Forge prints an end-to-end SDLC pipeline mapping each stage to its optimal provider with clear rationale.

---

## 3. Non-Functional Requirements (NFR)
- **Execution Speed:** Scoring and provider routing must resolve in < 100ms.
- **Portability:** Zero required native binaries for core functionality (fully self-contained in `npx forge-sdlc`).
- **Offline Support:** Built-in providers function completely offline.
