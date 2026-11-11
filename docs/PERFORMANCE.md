# TrioPrime Performance Baselines & Cost Ledger

*Generated from Phase 0 Discovery — 2026-11-10*

---

## Baselines & Budgets

| Metric | Baseline | Target | Budget |
|--------|----------|--------|--------|
| **Lead Capture Latency** (webhook → DB write) | ~200ms (est.) | <100ms | — |
| **Market Analysis** (region query, 50 items) | ~50ms (est.) | <20ms | — |
| **Content Generation** (per post) | ~2s (HF API) | <1s | — |
| **Orchestrator Cycle** (scan + follow-up + KPI) | ~5s (est.) | <2s | — |
| **Pages Load Time** (trio-crm-staging.pages.dev) | ~1.2s (est.) | <800ms | — |
| **Monthly Infra Cost** | **$0** (Cloudflare Free tier) | <$50 | **$50/mo** |
| **Cost per 1ms p95 improvement** | N/A | — | **$10/ms** |
| **ROI Threshold** | — | — | **0.1 ms/$** |

---

## Cost Ledger

| Component | Baseline Cost ($/mo) | After Cost ($/mo) | Δ Cost | Δ Latency | ROI (ms/$) | Date | Verdict |
|---|---|---|---|---|---|---|---|
| Cloudflare Pages (Free) | 0 | 0 | 0 | — | ∞ | 2026-11-10 | keep |
| Cloudflare Workers (Free) | 0 | 0 | 0 | — | ∞ | 2026-11-10 | keep |
| Cloudflare D1 (Free tier) | 0 | 0 | 0 | — | ∞ | 2026-11-10 | keep |
| Cloudflare KV (Free tier) | 0 | 0 | 0 | — | ∞ | 2026-11-10 | keep |
| Hugging Face API (est. 100 calls/day) | 0 | ~$5 | +5 | -1s (est.) | 200 | 2026-11-10 | keep* |
| GitHub Actions (Free tier) | 0 | 0 | 0 | — | ∞ | 2026-11-10 | keep |

\* *Hugging Face free tier may have limits; monitor usage.*

---

## Cost Budgets

| Budget Type | Limit | Current | Status |
|---|---|---|---|
| Monthly infra budget | $50 | $0 | ✅ 0% |
| Cost per 1ms p95 improvement | $10 | N/A | ✅ |
| Cost per 100 QPS capacity | $20 | N/A | ✅ |
| AI/ML API budget | $20 | ~$5 | ✅ 25% |

---

## Optimization Opportunities (Cost-Aware)

| # | Optimization | Est. Cost ($/mo) | Est. Latency Gain | ROI (ms/$) | Meets 0.1 Threshold? | Phase |
|---|---|---|---|---|---|---|
| 1 | Add Redis (KV) caching for portfolio queries | $0 (Free tier) | -30ms | ∞ | ✅ | 5 |
| 2 | Optimize JSON file reads → D1 queries | $0 | -50ms | ∞ | ✅ | 4 |
| 3 | Batch Telegram webhook processing | $0 | -20ms | ∞ | ✅ | 1 |
| 4 | Add indexes to D1 for region queries | $0 | -15ms | ∞ | ✅ | 2 |
| 5 | Prefetch listings.json on Worker startup | $0 | -200ms (cold start) | ∞ | ✅ | 5 |
| 6 | Upgrade to Cloudflare Workers Paid ($5/mo) | $5 | -100ms (CPU time) | 20 | ✅ | 5 |
| 7 | Add D1 read replica (not available) | N/A | N/A | N/A | — | — |
| 8 | Migrate JSON to full D1 (migration cost) | $0 (dev time) | -80ms | ∞ | ✅ | 4 |

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-11-10 | Stay on Cloudflare Free tier | Current load (2 users, low QPS) well within free limits |
| 2026-11-10 | Use JSON files as primary, D1 as secondary | Simplicity for MVP; D1 for future scale |
| 2026-11-10 | No CI/CD pipeline yet | Manual wrangler deploy acceptable for now |

---

## Next Review

**Scheduled:** 2026-12-10 (30 days)

**Questions for next review:**
- Actual QPS measured from Worker analytics
- Hugging Face API usage vs. free tier limits
- Lead capture latency measured (add timing logs)
- D1 query performance with growing dataset