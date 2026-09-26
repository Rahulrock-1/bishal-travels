# 🔄 Forge SDLC — Unified Iteration & Documentation Architecture (ITERATIONS.md)

> **Autonomous Iteration Ledger & Token-Cost Optimized Storage Engine**  
> Tracks all sequential iteration cycles, multi-module feature folders, artifact history diffs, and token optimization metrics.

---

## 📁 1. Master Iteration & Documentation Folder Structure

All iterations and SDLC outputs are stored in a unified, deterministic hierarchy under `.forge/`:

```
.forge/
├── artifacts/                           # Active workspace artifacts (latest synchronized state)
│   ├── history/                         # Historical version archives (.v1.md, .v2.md, ...)
│   │   ├── architecture.v1.md
│   │   ├── spec.v1.md
│   │   └── tasks.v1.md
│   ├── brainstorm.md                    # Brainstorming & Lateral Ideation (BMAD)
│   ├── brd.md                           # Business Requirements Document (BMAD)
│   ├── constitution.md                  # Non-Negotiable Invariants (Spec Kit)
│   ├── spec.md                          # Given-When-Then Specification (Spec Kit)
│   ├── architecture.md                  # C4 Technical Architecture & ADRs (BMAD)
│   ├── plan.md                          # Phased Milestone Execution Roadmap (Spec Kit)
│   ├── tasks.md                         # Atomic Developer Checklist (Spec Kit)
│   ├── analysis.md                      # Cross-Artifact Consistency Audit (Spec Kit)
│   ├── test-report.md                   # Automated Test Suites (Internal)
│   ├── review.md                        # 5-Lens Multi-Perspective Review (BMAD)
│   ├── security-audit.md                # STRIDE & OWASP AppSec Audit (Internal)
│   └── convergence.md                   # Release Readiness Burndown (Spec Kit)
│
├── iterations/                          # Immutable sequential iteration snapshots
│   ├── README.md                        # Auto-generated iteration catalog
│   ├── iteration-1/                     # Full snapshot of Iteration 1
│   │   ├── manifest.json                # Execution metadata, provider authors, byte sizes
│   │   └── ...                          # Complete artifact documents at Iteration 1
│   ├── iteration-2/                     # Full snapshot of Iteration 2
│   │   ├── manifest.json
│   │   └── ...
│   └── iteration-N/                     # Active iteration snapshot
│
├── functionalities/                     # Modular feature-scoped documentation
│   ├── core/                            # Core foundational architecture & tasks
│   │   ├── manifest.json
│   │   └── ...
│   ├── auth/                            # Authentication module specs & tasks
│   └── billing/                         # Billing module specs & tasks
│
└── runs/                                # Granular execution run traces
    └── run-<timestamp>-<workflowId>/    # Isolated per-run logs & stage diffs
```

---

## 📊 2. Chronological Iteration Ledger

| Iteration # | Snapshot Folder | Feature Module | Artifacts Generated | Provider Engine(s) | Timestamp | Snapshot Directory |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Iteration 1** | `iteration-1` | `core` | 1 artifacts | `BMAD` | 26/9/2026, 12:14:02 pm | `.forge/iterations/iteration-1/` |
| **Iteration 2** | `iteration-2` | `core` | 16 artifacts | `BMAD, SPECKIT, INTERNAL` | 26/9/2026, 12:15:42 pm | `.forge/iterations/iteration-2/` |

---

## 📦 3. Feature / Functionality Modules

| Feature Module | Artifacts Scoped | Storage Path | Last Synchronized |
| :--- | :---: | :--- | :--- |
| **`core`** | 17 artifacts | `.forge/functionalities/core/` | 26/9/2026, 12:15:42 pm |

---

## 💰 4. Token Cost Optimization Architecture

Forge enforces strict token optimization policies across every development iteration:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TOKEN CONSUMPTION CONTROL POLICIES                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Zero-Token Offline Default   │ Deterministic AST analysis ($0.00 cost)  │
│  2. Strict Dependency Ingestion  │ Only passes declared input files (0 bloat│
│  3. Differential Iteration Diffs │ Passes surgical diffs, not 100k LOC code │
│  4. Local Model Offloading       │ Routes bulk tasks to Ollama / DeepSeek   │
│  5. Immutable Artifact Caching   │ Reuses cached artifacts when unchanged   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 5. Iteration Management Commands

- **Inspect Iteration Status:** `npx forge-sdlc status` or `forge dashboard`
- **Auto-Heal Documentation Drift:** `npx forge-sdlc heal --apply`
- **Run Multi-Provider Consensus:** `npx forge-sdlc swarm review`
- **Execute Next Iteration Workflow:** `npx forge-sdlc workflow run full-sdlc --functionality <module>`
