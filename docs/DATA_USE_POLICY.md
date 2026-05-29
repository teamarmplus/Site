# SiteVerdict Data Use Policy

**For internal use and data provider communication.**  
*Last updated: 2026-05-27*

---

## What SiteVerdict does with official data

SiteVerdict displays derived property-context summaries sourced from official Australian government open datasets. We do not sell, redistribute, or sublicence raw datasets.

Every result shown to end users carries:

> *Not a planning certificate. Not legal, financial, investment, or development advice. Professional verification required before any property, finance, or development decision.*

---

## Data use principles

| Principle | What it means |
|---|---|
| **Licence-first** | Confirm commercial use, automated query rights, and attribution before integrating any source |
| **Attribution always** | Every source attributed per its licence in the result and on /attribution |
| **No raw resale** | Raw datasets are never sold, redistributed, or sublicenced |
| **Honest status** | If data is not connected, the result says so clearly — no fake zones |
| **AI-assisted, not AI-final** | AI assists with report drafting; results are not presented as authoritative determinations |
| **Professional verification** | Every result directs users to verify with a licensed professional |

---

## Data sources and licences

Full registry: `data/state-source-registry.json`

Summary by state:

| State | Primary source | Licence |
|---|---|---|
| NSW | NSW Planning Portal (DPHI) | CC BY 4.0 |
| TAS | theLIST (Land Tasmania) | CC BY 3.0 AU |
| QLD | QSpatial LPPF (DSDSATSIP) | CC BY 4.0 |
| ACT | ACTGOV ArcGIS Online | CC BY 4.0 (assumed — verify) |
| VIC | Vicmap Planning (DTP) — pending | CC BY 4.0 |
| SA | SA Spatial Hub (DPTI) — pending | TBC on registration |
| WA | SLIP Landgate — pending | Landgate licence |
| NT | NTLIS — research ongoing | TBC |

---

## Automated queries

SiteVerdict performs point-in-polygon queries (single coordinate per user request) against official ArcGIS REST and WFS endpoints. We do not bulk-download or scrape beyond what is needed for a single address lookup.

Rate limiting: where a published rate limit exists, we respect it. Where none is documented, we apply a conservative maximum of one request per user action.

---

## Contact for data licensing questions

ABN: 42 663 950 070  
WhatsApp: 0402 623 628  
Website: armplusgroup.com.au

---

## What to say when a data provider asks

**"How do you use our data?"**

> We display derived property-context summaries to help users understand planning and land-use context before purchase, development, or finance decisions. We attribute your source in every result. We do not redistribute raw data.

**"Do you sell reports?"**

> Our tool is free for end users. We do not charge for access to your data or sell derived reports that reproduce substantial portions of your dataset.

**"Do you use AI?"**

> AI assists with drafting property-context summaries. Results are clearly labelled as context-only, carry a professional verification disclaimer, and are not presented as planning certificates.

**"What is your commercial model?"**

> We connect property professionals and service providers with people who need help — a referral and lead model. Data display is free to end users.
