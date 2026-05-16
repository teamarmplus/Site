# SiteVerdict — Batch Validation Tools

Server-side tools for backtesting SiteVerdict's scoring against real historical NSW DA records.

---

## Quick start

```bash
# Install (no extra dependencies — uses Node built-ins only)
# Node.js 16+ required

# Dry run: see what would be processed without calling any API
node tools/backtest-siteverdict.js --input data/backtest-input-sample.csv --limit 5 --dry-run

# 5-row test with free APIs only
node tools/backtest-siteverdict.js --input data/backtest-input-sample.csv --limit 5 --no-paid-api

# 100-row run with free APIs
node tools/backtest-siteverdict.js --limit 100 --no-paid-api

# 1000-row run (includes DA Leads comparables)
node tools/backtest-siteverdict.js --limit 1000
```

---

## Input CSV format

`data/backtest-input.csv` — columns:

| Column | Required | Description |
|---|---|---|
| address | Yes | Street address |
| suburb | Yes | Suburb |
| postcode | Yes | Postcode |
| council | Yes | LGA name |
| da_number | No | DA reference number |
| da_status | Yes | Approved / Refused / Withdrawn |
| development_type | No | e.g. "Two lot subdivision" |
| lots_or_dwellings | No | Actual number of lots/dwellings |
| estimated_cost | No | Development cost (numeric) |
| lodgement_date | No | YYYY-MM-DD |
| determination_date | No | YYYY-MM-DD |

A sample is provided at `data/backtest-input-sample.csv`.

---

## Output files

| File | Description |
|---|---|
| `data/backtest-results.csv` | Row-level results with SiteVerdict scores |
| `data/backtest-results-summary.json` | Aggregate metrics and band breakdown |
| `data/backtest-results-report.md` | Markdown report with tables and recommendations |

---

## CLI options

| Flag | Default | Description |
|---|---|---|
| `--limit N` | 10 | Process N rows (safety default) |
| `--dry-run` | false | Print plan without any API calls |
| `--no-paid-api` | false | Skip DA Leads; free APIs only |
| `--no-ai` | always | AI is never used in batch mode |
| `--input FILE` | data/backtest-input.csv | Input CSV path |
| `--output FILE` | data/backtest-results.csv | Output CSV path |
| `--resume` | false | Skip already-processed rows |
| `--delay-ms N` | 1200 | ms between API requests |

---

## Safety notes

- **No AI calls** — Claude API is never used
- **Rate limited** — 1 request per 1200ms by default (Nominatim limit compliance)
- **Cached** — results stored in `data/cache/` — same address = no repeat API call
- **No paid API by default** — use `--no-paid-api` to skip DA Leads
- **Resumable** — use `--resume` to continue a stopped run
- **Default limit is 10** — must explicitly set `--limit 1000` for large runs

---

## Estimated API cost (1,000 rows)

| Source | Calls | Cost |
|---|---|---|
| Nominatim geocoding | ~1,000 | Free (rate limited) |
| NSW Planning Portal (12 layers) | ~12,000 | Free (government) |
| NSW Cadastre | ~1,000 | Free (government) |
| DA Leads comparables | ~1,000 | Paid (if enabled) |
| **Total free APIs** | ~14,000 | ~5–8 hours at 1200ms delay |
| **Anthropic Claude** | 0 | $0 |

---

## Cache

Results are cached in `data/cache/` by MD5 hash of address + coordinate.

Cache files are excluded from git. To clear cache:
```bash
rm -rf data/cache/
```

---

## Scoring methodology

Scores are calculated by the same logic as the website (`assets/sv-check.js`).

Weights:
- Planning strength: 20%
- Yield potential: 20%
- Overlay risk: 15%
- Approval confidence: 15%
- Infrastructure risk: 10%
- Holding cost risk: 10%
- Council complexity: 5%
- Exit potential: 5%

Final score = weighted average × 10 → 1–99

Match logic:
- SiteVerdict score ≥ 65 AND real outcome = Approved → **CORRECT**
- SiteVerdict score ≥ 65 AND real outcome = Refused → **FALSE_POSITIVE**
- SiteVerdict score < 50 AND real outcome = Approved → **FALSE_NEGATIVE**
