# DTES Community Tools

Open-source web tools to support harm reduction, service navigation, and crisis response in Vancouver's Downtown Eastside.

---

## Pages

| File | URL | Description |
|------|-----|-------------|
| `index.html` | `/` | Landing page linking to both tools |
| `dtes-services.html` | `/dtes-services.html` | Interactive community services directory |
| `overdose-watch.html` | `/overdose-watch.html` | OD Watch prototype app |
| `onepager.html` | `/onepager.html` | OD Watch proposal document |
| `qa.html` | `/qa.html` | OD Watch anticipated questions document |

---

## Tools

### DTES Services Map
An interactive map and directory of harm reduction, housing, health, and social services across the Downtown Eastside. Filterable by category, mobile-friendly, no login required.

### DTES OD Watch ⚠ Prototype — Mock Data Only
A prototype real-time overdose event tracking tool. Frontline workers or peer responders log events (substance type, outcome, location) in a few taps; events appear immediately on a live Leaflet/OpenStreetMap map filterable by time window.

> **⚠ Important:** OD Watch currently runs entirely on computer-generated mock data. No real overdose events are displayed, stored, or transmitted. The mock dataset is modelled on published statistics from the BCCDC Unregulated Drug Poisoning Emergency Dashboard (~2,000 events/month in Vancouver) to illustrate what a live tool could look like. Do not interpret any map data as real.

---

## Tech Stack

All pages are **plain HTML/CSS/JS — no build step, no framework, no backend**.

| Dependency | Used in | Source |
|------------|---------|--------|
| [Leaflet.js 1.9.4](https://leafletjs.com/) | OD Watch, Services Map | unpkg CDN |
| [CartoDB Positron tiles](https://carto.com/basemaps/) | Both maps | OpenStreetMap data, CARTO CDN |
| [DM Serif Display + DM Sans](https://fonts.google.com/) | All pages | Google Fonts CDN |

No API keys are required. No data is sent to any server. Everything runs client-side.

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

No server required for most pages. For Leaflet maps, serve over HTTP rather than opening files directly (to avoid CORS issues with map tiles):

```bash
# Python 3
python -m http.server 8000

# Node (npx)
npx serve .
```

Then open `http://localhost:8000`.

---

## File Structure

```
/
├── index.html              # Landing page
├── dtes-services.html      # Community services map
├── overdose-watch.html     # OD Watch prototype
├── onepager.html           # OD Watch proposal one-pager
├── qa.html                 # OD Watch Q&A document
└── README.md               # This file
```

---

## Data Sources

Statistics and geographic patterns used to generate OD Watch mock data are drawn from:

- [BC Coroners Service — Unregulated Drug Deaths](https://www2.gov.bc.ca/gov/content/life-events/death/coroners-service/statistical-reports) (2024–2025)
- [BCEHS Overdose & Drug Poisoning Data](https://www.bcehs.ca/about/accountability/data/overdose-drug-poisoning-data) (2024–2025)
- [BCCDC Unregulated Drug Poisoning Emergency Dashboard](https://public.tableau.com/app/profile/bccdc/viz/UnregulatedDrugPoisoningEmergencyDashboard/Introduction)
- Nyx E., Kalicum J., Kerr T. — *"Overdose and British Columbia's Hospital System: Have We Miscounted?"* BC Medical Journal, December 2025
- [Government of BC — Good Samaritan Drug Overdose Act](https://laws-lois.justice.gc.ca/eng/acts/G-11.5/)

---

## Privacy

OD Watch is designed with privacy as a hard constraint, not an afterthought:

- **No personal data** about people who overdose is collected or stored
- **No tracking** — no analytics, cookies, or third-party data collection
- **No backend** — in the current prototype, all data is generated and held in browser memory only; nothing is transmitted
- A production version would require a data governance policy, community oversight, and legal review before any real data is collected

---

## Status

| Tool | Status |
|------|--------|
| DTES Services Map | ✅ Live |
| OD Watch | 🚧 Prototype — mock data only |
| OD Watch backend / real data | ❌ Not built — seeking community partner |

OD Watch is an unsanctioned prototype being developed to demonstrate the concept to potential community partners in the DTES harm reduction sector. It has not been adopted or endorsed by any organisation.

---

## Contributing

Issues and pull requests welcome. If you work in harm reduction or public health in the DTES and want to discuss the OD Watch concept, feel free to open an issue.

---

## Licence

MIT — free to use, modify, and redistribute. See `LICENSE` for details.
