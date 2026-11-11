# Architecture Optimization Plan — TrioPrime

*Journey started: 2026-11-10 | Owner: Gökcan / Ozancan | Scope: full (phases 1-8)*

---

## Context (from Phase 0 Discovery)

**System:** TrioPrime / Trio Emlak — Real estate CRM for Ayvalık/Cunda/Altınova/Gömeç/İstanbul
**Stack:** Python 3.11+ (faze-1/2/3/4), JavaScript (Cloudflare Worker), HTML/CSS (Pages), Cloudflare D1 + JSON
**Deployment:** Cloudflare Pages + Workers, git worktrees per phase
**Hot Paths:** Lead Capture, Market Analysis, Content Generation, Orchestrator Cycle
**Constraints:** $0 current spend, $50/mo budget, 0.1 ms/$ ROI threshold, 2 authorized Telegram users

---

## Phase Tracker

| Phase | Name | Status | Started | Completed | Owner | Notes |
|-------|------|--------|---------|-----------|-------|-------|
| 0 | Auto-Discovery & Onboarding | ✅ **Done** | 2026-11-10 | 2026-11-10 | Kriss | Outputs: phase0-discovery.json, ARCHITECTURE.md, PERFORMANCE.md, HANDOFF.md |
| 1 | Characterization Tests | ⏳ **Ready** | — | — | Gökcan | **Blockers: no pytest, no profiler** |
| 2 | Clean Architecture Boundaries | ⏳ Pending | — | — | Gökcan | Depends on Phase 1 |
| 3 | Software Design Philosophy | ⏳ Pending | — | — | Gökcan | Depends on Phase 2 |
| 4 | Refactoring Patterns | ⏳ Pending | — | — | Gökcan | Depends on Phase 2-3 |
| 5 | System Design (Performance) | ⏳ Pending | — | — | Gökcan | Needs k6, KV cache |
| 6 | DDIA Systems (Reliability) | ⏳ Pending | — | — | Gökcan | Needs D1 query insights |
| 7 | Release Automation | ⏳ Pending | — | — | Gökcan | Needs CI/CD |
| 8 | Pragmatic Programmer Habits | ⏳ Pending | — | — | Gökcan | Final phase |

---

## Phase 1 — Characterization Tests (Next)

### Goal
Create characterization tests that lock current behavior before any refactoring.

### Targets
| Module | Functions to Test | Test File |
|--------|-------------------|-----------|
| `.worktrees/faze-1/telegram_processor.py` | `normalize()`, `match_rule()`, `process()` | `tests/faze1/test_telegram_processor.py` |
| `.worktrees/faze-1/webhook_processor.py` | `process_webhook()`, `transform_to_db()` | `tests/faze1/test_webhook_processor.py` |
| `.worktrees/faze-2/analyst.py` | `analyze()`, `_has_region()` | `tests/faze2/test_analyst.py` |
| `.worktrees/faze-2/portfolio_db.py` | `load()`, `index()`, `match()` | `tests/faze2/test_portfolio_db.py` |
| `.worktrees/faze-3/content_generator.py` | `generate()`, `format_post()` | `tests/faze3/test_content_generator.py` |
| `.worktrees/faze-3/social_media_posts.py` | `format_*()`, `schedule()` | `tests/faze3/test_social_media_posts.py` |
| `.worktrees/faze-4/orchestrator.py` | `market_scan()`, `follow_up_leads()`, `report()` | `tests/faze4/test_orchestrator.py` |

### Prerequisites (Blockers)
- [ ] `pip install pytest pytest-cov pytest-mock pyinstrument`
- [ ] Create `pyproject.toml` with `[tool.pytest.ini_options]`
- [ ] Create `tests/` directory structure
- [ ] Configure GitHub Actions CI (minimal: `pytest -v`)

### MCP Delegation (per mcp-integration.md)
- **claude-code**: "Write characterization tests for telegram_processor.py covering normalize, match_rule, process. Use pytest. Mock file I/O and Telegram message objects. Target 90% coverage."
- **codex**: "Write characterization tests for analyst.py and portfolio_db.py. Mock JSON file reads/writes. Test region matching logic with Turkish characters (ı→i)."
- **opencode**: "Write characterization tests for orchestrator.py. Mock subprocess.run for market_scan. Test follow_up_leads message templating."

### Exit Criteria
- [ ] All 7 test files created
- [ ] `pytest -v` passes with >80% coverage on hot paths
- [ ] GitHub Actions CI runs pytest on push
- [ ] Baselines recorded in PERFORMANCE.md (latency per function)

---

## Phase 2 — Clean Architecture Boundaries

### Goal
Extract Repository interfaces; implement D1 + JSON adapters; enforce dependency rule.

### Targets
| Interface | Methods | Adapters |
|-----------|---------|----------|
| `LeadRepository` | `create()`, `get_by_chat()`, `update_status()` | `D1LeadRepository`, `JSONLeadRepository` |
| `ListingRepository` | `find_by_region()`, `get_price_stats()` | `D1ListingRepository`, `JSONListingRepository` |
| `PortfolioRepository` | `load()`, `index()`, `match()` | `D1PortfolioRepository`, `JSONPortfolioRepository` |

### MCP Delegation
- **claude-code**: "Extract LeadRepository interface from telegram_processor.py. Create D1LeadRepository using Cloudflare D1 binding. Create JSONLeadRepository using local file. Use dependency injection."
- **opencode**: "Extract ListingRepository from analyst.py. Implement region query in D1 with SQL. Keep JSON fallback for local dev."

### Exit Criteria
- [ ] 3 interfaces + 6 adapters implemented
- [ ] All faze modules use repositories (no direct DB/JSON access)
- [ ] Layer map updated in ARCHITECTURE.md
- [ ] No dependency violations (inward only)

---

## Phase 3 — Software Design Philosophy

### Goal
Apply "Tell, Don't Ask", replace anemic domain models with rich behavior.

### Targets
| Module | Current Issue | Refactoring |
|--------|---------------|-------------|
| `analyst.py` | Anemic: `analyze()` does all logic, `Listing` is data bag | Move `price_stats()`, `trend()` to `Listing` aggregate |
| `portfolio_db.py` | `match()` is procedural | Move matching logic to `Portfolio` entity |
| `orchestrator.py` | God object: scan + follow-up + KPI | Split into 3 services with clear responsibilities |

### MCP Delegation
- **opencode**: "Refactor analyst.py: create Listing class with price_stats(), trend() methods. Move _has_region() to Listing.matches_region(). Update analyze() to use Listing behavior."
- **claude-code**: "Split orchestrator.py into MarketScanService, FollowUpService, KPIReportService. Each with single responsibility. Update ARCHITECTURE.md layer map."

### Exit Criteria
- [ ] No anemic domain models in hot paths
- [ ] Services follow Single Responsibility Principle
- [ ] ARCHITECTURE.md updated

---

## Phase 4 — Refactoring Patterns

### Goal
Apply preparatory refactoring, strangler fig, cache-aside, query optimization.

### Targets
| Pattern | Application | Module |
|---------|-------------|--------|
| Preparatory Refactoring | Extract Repository interfaces (done in Phase 2) | All |
| Strangler Fig | Migrate JSON → D1 incrementally | LeadRepository, ListingRepository |
| Cache-Aside | KV cache for portfolio queries | PortfolioRepository |
| Query Optimization | D1 indexes on region, price, date | D1 adapters |
| Idempotency Keys | Lead creation deduplication | LeadRepository |

### MCP Delegation
- **claude-code**: "Implement cache-aside in PortfolioRepository: check KV first, fallback to D1/JSON, populate KV on miss. TTL 5min."
- **codex**: "Add D1 indexes: CREATE INDEX idx_listings_region ON listings(region); CREATE INDEX idx_listings_price ON listings(price); CREATE INDEX idx_leads_created ON leads(created_at);"
- **opencode**: "Add idempotency to LeadRepository.create(): generate key from chat_id+user_id+text_hash, check before insert."

### Exit Criteria
- [ ] Cache-aside implemented with KV
- [ ] D1 indexes created and verified with EXPLAIN QUERY PLAN
- [ ] Idempotency keys prevent duplicate leads
- [ ] PERFORMANCE.md ledger updated with latency/cost

---

## Phase 5 — System Design (Performance)

### Goal
Meet latency budgets with cost-aware optimizations.

### Budgets (from PERFORMANCE.md)
| Hot Path | Current (est.) | Target | Budget |
|----------|----------------|--------|--------|
| Lead Capture | 200ms | <100ms | -100ms |
| Market Analysis | 50ms | <20ms | -30ms |
| Content Generation | 2000ms | <1000ms | -1000ms |
| Orchestrator Cycle | 5000ms | <2000ms | -3000ms |
| Pages Load | 1200ms | <800ms | -400ms |

### Optimizations (from PERFORMANCE.md Cost Ledger)
| # | Optimization | Cost | Gain | ROI | Phase |
|---|--------------|------|------|-----|-------|
| 1 | KV cache portfolio queries | $0 | -30ms | ∞ | 4/5 |
| 2 | JSON → D1 queries | $0 | -50ms | ∞ | 4 |
| 3 | Batch webhook processing | $0 | -20ms | ∞ | 1 |
| 4 | D1 indexes | $0 | -15ms | ∞ | 4 |
| 5 | Prefetch listings on Worker start | $0 | -200ms | ∞ | 5 |
| 6 | Workers Paid tier ($5/mo) | $5 | -100ms | 20 | 5 |

### Load Testing
- **Tool:** k6 (install: `brew install k6`)
- **Scripts:** `load/lead_capture.js`, `load/market_analysis.js`, `load/pages_load.js`
- **Run:** `k6 run load/lead_capture.js` in CI

### MCP Delegation
- **codex**: "Write k6 load test for lead capture: simulate 10 VUs, 30s, target p95 < 100ms. Use Telegram Bot API mock."
- **claude-code**: "Implement Worker startup prefetch: load listings.json into KV on Worker install. Update worker/index.js."

### Exit Criteria
- [ ] All budgets met (p95 < target)
- [ ] k6 tests in CI, run on every PR
- [ ] PERFORMANCE.md ledger shows actuals vs. baselines
- [ ] Cost within $50/mo budget

---

## Phase 6 — DDIA Systems (Reliability)

### Goal
Resilience patterns: idempotency, retries, circuit breakers, outbox.

### Targets
| Pattern | Implementation | Module |
|---------|----------------|--------|
| Idempotency Keys | Lead creation (Phase 4) + Follow-up messages | LeadRepository, FollowUpService |
| Retry with Backoff | Telegram API calls, HF API calls | telegram_processor, content_generator |
| Circuit Breaker | Hugging Face API, Telegram API | content_generator, telegram_processor |
| Outbox Pattern | Follow-up messages → D1 outbox table → Worker processes | FollowUpService |
| Read-Your-Writes | Lead create → immediate read consistency | LeadRepository (D1) |

### MCP Delegation
- **opencode**: "Implement circuit breaker for Hugging Face API in content_generator.py: fail after 3 errors, half-open after 30s, fallback to template."
- **claude-code**: "Create outbox table in D1: CREATE TABLE outbox (id, event_type, payload, created_at, processed_at). Worker polls and sends follow-ups."
- **codex**: "Add retry with exponential backoff to Telegram API calls in telegram_processor.py: max 3 retries, base 1s, max 10s."

### Exit Criteria
- [ ] All external calls have retry + circuit breaker
- [ ] Follow-ups go through outbox (no lost messages)
- [ ] Idempotency verified under concurrent load
- [ ] Chaos test: kill Worker mid-cycle, verify recovery

---

## Phase 7 — Release Automation

### Goal
CI/CD with preview deployments, gates, rollback.

### Targets
| Pipeline | Stages | Gates |
|----------|--------|-------|
| **CI** | lint → test → typecheck → build | pytest >80%, mypy strict, no new violations |
| **Preview** | wrangler pages deploy (preview) | Auto on PR, URL in PR comment |
| **Production** | wrangler pages deploy (prod) | Manual approve, canary 10% → 100% |
| **Rollback** | wrangler rollback | One-click, <2min |

### MCP Delegation
- **claude-code**: "Create .github/workflows/ci.yml: jobs for lint (ruff), test (pytest), typecheck (mypy), build (wrangler). Add perf gate: fail if pytest-benchmark regression >10%."
- **opencode**: "Create .github/workflows/deploy-preview.yml: on PR, wrangler pages deploy --branch=preview. Comment PR with preview URL."
- **codex**: "Create deploy-prod.yml: manual dispatch, canary via Cloudflare Workers KV feature flag."

### Exit Criteria
- [ ] CI runs on every push/PR
- [ ] Preview deployments on every PR
- [ ] Production deploy is manual + canary
- [ ] Rollback tested and documented

---

## Phase 8 — Pragmatic Programmer Habits

### Goal
Automation, documentation, team conventions.

### Targets
| Habit | Implementation |
|-------|----------------|
| **Make Targets** | `make test`, `make lint`, `make deploy-preview`, `make deploy-prod`, `make health-check` |
| **Runbooks** | `docs/runbooks/lead-capture-failure.md`, `docs/runbooks/deploy-rollback.md`, `docs/runbooks/hf-api-down.md` |
| **Query Count Gate** | CI fails if checkout query count > 5 (pytest-mock + query counting) |
| **ADR Log** | `docs/adr/` for architectural decisions |
| **Team Conventions** | `docs/CONVENTIONS.md`: naming, error handling, logging, git flow |

### MCP Delegation
- **opencode**: "Create Makefile with targets: test, lint, typecheck, deploy-preview, deploy-prod, health-check, clean."
- **claude-code**: "Write runbook for lead capture failure: symptoms, diagnosis steps (check Worker logs, D1, Telegram webhook), recovery steps."
- **codex**: "Create CONVENTIONS.md: Python (PEP8, type hints, docstrings), JS (ESLint, Prettier), Git (conventional commits, worktree workflow)."

### Exit Criteria
- [ ] Makefile works for all common tasks
- [ ] 3 runbooks written and tested
- [ ] Query count gate in CI
- [ ] ADR log started (at least 3 ADRs)
- [ ] CONVENTIONS.md reviewed by team

---

## Artifacts Index

| Artifact | Location | Status |
|----------|----------|--------|
| Phase 0 Discovery | `docs/phase0-discovery.json` | ✅ |
| Architecture Diagrams | `docs/ARCHITECTURE.md` | ✅ |
| Performance Baselines | `docs/PERFORMANCE.md` | ✅ |
| Handoff Document | `docs/HANDOFF.md` | ✅ |
| Health Check Report | `docs/HEALTH-CHECK-REPORT.md` | ✅ |
| Optimization Plan | `docs/ARCHITECTURE-OPTIMIZATION-PLAN.md` | ✅ (this file) |
| Tech Debt | `docs/TECH-DEBT.md` | ⏳ |
| Testing Strategy | `docs/TESTING.md` | ⏳ |
| Reliability Design | `docs/RELIABILITY.md` | ⏳ |

---

## Next Immediate Action

**Start Phase 1: Characterization Tests**

```bash
cd /home/rw/Projects/trio-prime-static/TrioPrime

# 1. Install dependencies
pip install pytest pytest-cov pytest-mock pyinstrument

# 2. Create pyproject.toml
cat > pyproject.toml << 'EOF'
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --cov=.worktrees --cov-report=term-missing"
EOF

# 3. Create test directory structure
mkdir -p tests/faze1 tests/faze2 tests/faze3 tests/faze4

# 4. Write first test: tests/faze1/test_telegram_processor.py
# (Use MCP delegation prompts from mcp-integration.md)

# 5. Run tests
pytest -v

# 6. Commit and push
git add .
git commit -m "feat: add Phase 1 characterization tests for faze-1"
git push
```

---

## Sign-Off

- **Journey Owner:** Gökcan — Ready to start Phase 1
- **Decision Maker:** Ozancan Serhan — Scope and budget approved
- **AI Operator:** Kriss — Phase 0 complete, artifacts generated