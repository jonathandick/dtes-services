# DTES Community Tools

Open-source web tools to support harm reduction, service navigation, and crisis response in Vancouver's Downtown Eastside.

---

## Pages

### Community Services

| File | Description |
|------|-------------|
| `index.html` | Home page — crisis stats strip, tool directory grouped by category |
| `dtes-services.html` | Interactive community services map and directory |
| `vancouver-shelters.html` | Emergency shelter directory (filterable by area, population, capacity type) |
| `social-housing.html` | Social and supportive housing directory (SROs, co-ops, supportive housing) |
| `treatment-programs.html` | Lower Mainland treatment program directory (residential, outpatient, detox) |
| `drug-supply.html` | Toxic drug supply tracker — active alerts, substance breakdown, BCEHS stats |
| `ctct.html` | Community Transitional Care Team profile (history, care model, referral pathway) |

### OD Response

| File | Description |
|------|-------------|
| `overdose-watch.html` | OD Watch prototype — real-time event logging and animated map |
| `public-health-dashboard.html` | Public Health Command View — aggregated stats, charts, hotspots (wired to OD Watch data) |
| `pilot-plan.html` | OD Watch pilot proposal document |
| `onepager.html` | OD Watch one-page overview |
| `qa.html` | OD Watch anticipated questions document |

---

## Tools

### DTES Services Map
Interactive map and searchable directory of harm reduction, housing, health, and social services across the Downtown Eastside. Multi-select filters, detail pane, mobile-friendly, no login required.

### Vancouver Shelter Directory
Searchable, filterable directory of emergency shelters across Vancouver — capacity type, eligibility, pet-friendly listings, area and population filters.

### Social Housing Directory
Directory of SROs, supportive housing, and co-ops in the Downtown Eastside with operator, contact, and referral information.

### LM Treatment Programs
Directory of residential and outpatient treatment programs across the Lower Mainland. Filterable by type and location.

### Toxic Drug Supply
Current state of Vancouver's unregulated drug supply — active contamination alerts (carfentanil, phenazolam, medetomidine), substance-by-substance breakdown, naloxone guidance, drug checking locations, and 2025 overdose statistics from BCEHS.

### CTCT Profile
Reference document for the Community Transitional Care Team — founding history, current care model, harm reduction principles, and referral pathway from St. Paul's and VGH.

### DTES OD Watch ⚠ Prototype — Mock Data Only
Real-time overdose event logging and map for frontline workers and peer responders. Events are logged in three taps (substance, outcome, location), appear immediately on a live Leaflet map, and can be replayed as an animation with configurable time windows, cluster sizes, and colour-by dimensions (substance or outcome).

> **⚠ Important:** OD Watch runs entirely on computer-generated mock data. No real overdose events are displayed, stored, or transmitted. The mock dataset is modelled on published statistics from the BCCDC Unregulated Drug Poisoning Emergency Dashboard (~2,000 events/month in Vancouver). Do not interpret any map data as real.

### Public Health Command View ⚠ Prototype — Mock Data Only
Command-level dashboard powered by the same mock dataset as OD Watch. All metrics, charts, hotspot rankings, and the substance trend table are computed live from the shared event data and respond to the selected time window (1h / 6h / 24h / 7d / 30d). Includes: total events vs prior period, EMS rate trend, fatal count, community-resolved rate, hourly demand pattern, trend chart, substance and response donuts, and a per-substance early-warning table.

---

## Tech Stack

All pages are **plain HTML/CSS/JS — no build step, no framework, no backend**.

| Dependency | Used in | Source |
|------------|---------|--------|
| [Leaflet.js 1.9.4](https://leafletjs.com/) | OD Watch, Services Map, Shelters, Housing, Treatment | unpkg CDN |
| [Chart.js 4.4.1](https://www.chartjs.org/) | OD Watch (animated chart), PH Dashboard | cdnjs CDN |
| [CartoDB Positron tiles](https://carto.com/basemaps/) | All maps | OpenStreetMap data, CARTO CDN |
| [DM Serif Display + DM Sans](https://fonts.google.com/) | All pages | Google Fonts CDN |

No API keys required. No data sent to any server. Everything runs client-side.

---

## File Structure

```
/
├── index.html                    # Home page
├── dtes-services.html            # Community services map
├── vancouver-shelters.html       # Shelter directory
├── social-housing.html           # Social housing directory
├── treatment-programs.html       # Treatment programs directory
├── drug-supply.html              # Toxic drug supply tracker
├── ctct.html                     # CTCT profile
├── overdose-watch.html           # OD Watch prototype
├── public-health-dashboard.html  # Public Health Command View
├── pilot-plan.html               # OD Watch pilot proposal
├── onepager.html                 # OD Watch one-pager
├── qa.html                       # OD Watch Q&A
├── nav.js                        # Shared navigation (injected into every page)
├── shared.css                    # Design system — tokens, reset, shared utilities
├── od-watch/
│   ├── data.js                   # Mock event generator (shared by OD Watch + PH Dashboard)
│   ├── animation.js              # Map animation, cell clustering, colour-by logic
│   ├── chart.js                  # Animated time-series chart (Chart.js)
│   ├── map.js                    # Leaflet map init and cluster layer
│   ├── log.js                    # Event log pane
│   ├── record.js                 # Event recording / form logic
│   ├── tabs.js                   # Tab switching
│   └── od-watch.css              # OD Watch styles
└── README.md
```

---

## Deploying

### GitHub Pages

1. Push all files to the root of your repository
2. Go to **Settings → Pages → Source**: `main` branch, `/ (root)`
3. Your site will be live at `https://yourusername.github.io/your-repo-name/`

### Vercel

1. Import the repository into [Vercel](https://vercel.com)
2. No build configuration needed — Vercel detects static HTML automatically
3. Each `.html` file is served at its clean URL (e.g. `/overdose-watch`)

### Local development

No server required for most pages. For Leaflet maps, serve over HTTP to avoid CORS issues with map tiles:

```bash
# Python 3
python -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000`.

---

## Data Sources

Statistics and geographic patterns used to generate mock data and populate the drug supply page are drawn from:

- [BCEHS Overdose & Drug Poisoning Data](https://www.bcehs.ca/about/accountability/data/overdose-drug-poisoning-data) (2025)
- [BCCDC Unregulated Drug Poisoning Emergency Dashboard](https://public.tableau.com/app/profile/bccdc/viz/UnregulatedDrugPoisoningEmergencyDashboard/Introduction)
- [BC Coroners Service — Unregulated Drug Deaths](https://www2.gov.bc.ca/gov/content/life-events/death/coroners-service/statistical-reports) (2024–2025)
- [BCCDC Substance Use & Harm Reduction Dashboard](https://www.bccdc.ca/health-professionals/data-reports/substance-use-harm-reduction-dashboard)
- Nyx E., Kalicum J., Kerr T. — *"Overdose and British Columbia's Hospital System: Have We Miscounted?"* BC Medical Journal, December 2025
- [Government of BC — Good Samaritan Drug Overdose Act](https://laws-lois.justice.gc.ca/eng/acts/G-11.5/)

---

## Privacy

OD Watch is designed with privacy as a hard constraint:

- **No personal data** about people who overdose is collected or stored
- **No tracking** — no analytics, cookies, or third-party data collection
- **No backend** — all data is generated and held in browser memory only; nothing is transmitted
- A production version would require a data governance policy, community oversight, and legal review before any real data is collected

---

## Status

| Tool | Status |
|------|--------|
| DTES Services Map | ✅ Live |
| Shelter Directory | ✅ Live |
| Social Housing Directory | ✅ Live |
| Treatment Programs Directory | ✅ Live |
| Toxic Drug Supply | ✅ Live (manually updated) |
| CTCT Profile | ✅ Live |
| OD Watch | 🚧 Prototype — mock data only |
| Public Health Dashboard | 🚧 Prototype — mock data only |
| OD Watch backend / real data | ❌ Not built — seeking community partner |

OD Watch and the Public Health Dashboard are unsanctioned prototypes built to demonstrate the concept to potential community partners in the DTES harm reduction sector. Neither has been adopted or endorsed by any organisation.

---

## Contributing

Issues and pull requests welcome. If you work in harm reduction or public health in the DTES and want to discuss the OD Watch concept, feel free to open an issue.

---

## Licence

MIT — free to use, modify, and redistribute. See `LICENSE` for details.
