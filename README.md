# 🛡️ Safe Site Checker

> A Chrome extension that automatically analyzes websites for phishing, scams, and security threats in real time — powered by a local Flask backend with a rule-based risk scoring engine.

---

## 📽️ Demo Video

https://your-demo-video-link-here.com


---

## 📌 Overview

**Safe Site Checker** is a browser security tool built as a Chrome Extension + Python Flask backend combo. Every time you visit a website, the extension automatically sends the URL to a local backend that runs a series of heuristic and rule-based checks to calculate a **risk score** (0–100). The result — safe or unsafe — is displayed as a live overlay on the page, and in detail via the extension popup.

Built for **HackHazard** by a three-member team.

---

## ✨ Features

- 🔍 **Automatic URL Scanning** — Checks every page you visit without any manual action
- 📊 **Risk Score Engine** — Calculates a 0–100 risk score based on multiple detection rules
- 🚨 **Live Page Overlay** — Shows a green ✓ or red ✕ badge directly on the webpage
- 🪟 **Detailed Popup** — Click the extension icon for full breakdown: score, reasons, and cached status
- ⚡ **24-Hour Result Cache** — SQLite-backed cache avoids redundant re-checks for recently visited URLs
- 🧠 **Multi-vector Detection** — Covers keyword matching, IP-based domains, suspicious TLDs, HTTP (non-HTTPS), typosquatting patterns, and subdomain depth
- 🔁 **Re-check Button** — Force a fresh scan from the popup anytime

---

## 🧱 Architecture

```
┌─────────────────────────────────┐       ┌──────────────────────────────────────┐
│        Chrome Extension          │       │         Flask Backend (Port 5001)     │
│                                  │       │                                      │
│  background.js  ──────────────── │──────▶│  /check  ──▶  checker.py            │
│  (tab listener)                  │       │               (analyze_url)          │
│                                  │◀──────│               ↓                      │
│  content.js                      │       │           keywords.py                │
│  (shows overlay badge)           │       │           (SUSPICIOUS_KEYWORDS)      │
│                                  │       │               ↓                      │
│  popup.js + popup.html           │       │           models.py                  │
│  (detailed results UI)           │       │           (SQLite cache via ORM)     │
└─────────────────────────────────┘       └──────────────────────────────────────┘
```

**Flow:**
1. User navigates to a URL → `background.js` captures the tab update event
2. It calls `GET /check?url=<url>` on the Flask backend
3. Flask checks the 24-hour SQLite cache first; if miss, runs `analyze_url()`
4. `checker.py` runs all detection rules and returns a risk score + reasons
5. Result is sent back to `content.js`, which renders the overlay badge on the page
6. The extension popup (`popup.js`) shows the full breakdown when clicked

---

## 🔍 Detection Rules

| Check | Points Added | Description |
|---|---|---|
| Suspicious Keywords | +25 each | Matches phrases like `"free money"`, `"verify account"`, `"crypto giveaway"`, etc. |
| IP Address as Domain | +30 | e.g. `http://192.168.1.1/login` — legitimate sites use domain names |
| Excessive Hyphens | +15 | 3+ hyphens in domain (common phishing pattern) |
| Suspicious TLD | +20 | `.xyz`, `.tk`, `.top`, `.cc`, `.ml`, `.gq`, `.ga`, `.cf`, `.pw` |
| HTTP (No HTTPS) | +10 | Unencrypted connection |

**Threshold:** `risk_score >= 10` → site marked **Unsafe**. Score is capped at 100.

---

## 📁 Project Structure

```
safe-site-checker/
│
├── extension/                  # Chrome Extension files
│   ├── manifest.json           # Extension config (MV3)
│   ├── background.js           # Service worker — listens for tab changes
│   ├── content.js              # Injected script — renders overlay badge
│   ├── content.css             # Scoped styles for the overlay
│   ├── popup.html              # Extension popup UI
│   ├── popup.js                # Popup logic & backend calls
│   ├── popup.css               # Popup styles
│   └── icons/                  # Extension icons (16px, 48px, 128px)
│
├── backend/                    # Flask Backend
│   ├── app.py                  # Flask app, routes, caching logic
│   ├── checker.py              # Core URL analysis engine
│   ├── keywords.py             # Suspicious keyword list
│   ├── models.py               # SQLAlchemy DB models (CheckedURL, UserReport)
│   ├── test_app.py             # Unit tests
│   └── view_db.py              # Helper script to inspect the SQLite database
│
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.8+
- Google Chrome browser
- `pip` package manager

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/safe-site-checker.git
cd safe-site-checker
```

---

### Step 2 — Set Up the Flask Backend

```bash
# Navigate to the backend folder
cd backend

# (Recommended) Create a virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install flask flask-cors flask-sqlalchemy
```

---

### Step 3 — Run the Backend Server

```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5001
```

> ✅ Keep this terminal running whenever you use the extension.

To verify it's working, open your browser and visit:
```
http://127.0.0.1:5001/
```
You should get: `{"status": "Backend Running"}`

---

### Step 4 — Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension/` folder from this project
5. The **Safe Site Checker** icon will appear in your toolbar

> ⚠️ Make sure the Flask backend (Step 3) is running before using the extension.

---

### Step 5 — Test It

Visit any website. You should see:
- A **green ✓ badge** (bottom-right) if the site appears safe
- A **red ✕ badge** (pulsing) if the site triggers risk flags

Click the extension icon for a full report with the risk score and flagged reasons.

---

## 🧪 Running Tests

```bash
cd backend
python -m pytest test_app.py -v
```

Test coverage includes:
- Health check endpoint
- Missing URL parameter handling
- Safe URL analysis (e.g. `https://www.google.com`)
- Unsafe URL detection (e.g. IP-based URLs over HTTP)
- Core `analyze_url()` function logic

---

## 🗄️ Inspecting the Database

To view all cached URL checks and user reports stored in `safesite.db`:

```bash
cd backend
python view_db.py
```

---

## 🔌 API Reference

### `GET /`
Health check.

**Response:** `{"status": "Backend Running"}`

---

### `GET /check?url=<url>`
Analyzes a URL for safety.

**Query Parameters:**
| Param | Required | Description |
|---|---|---|
| `url` | Yes | The full URL to analyze |

**Response:**
```json
{
  "url": "http://example.xyz/verify-account",
  "is_safe": false,
  "risk_score": 55,
  "reasons": [
    "Contains suspicious keyword: 'verify account'",
    "Uses a top-level domain often associated with spam/phishing",
    "Connection is not secure (HTTP instead of HTTPS)"
  ]
}
```

If served from cache, the response includes `"cached": true`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Browser Extension | JavaScript (Manifest V3), HTML, CSS |
| Backend | Python, Flask, Flask-CORS |
| Database | SQLite via Flask-SQLAlchemy |
| Detection Engine | Rule-based heuristics (Python) |
| Testing | Python `unittest` |

---

## 🚀 Future Improvements

- [ ] Load keywords and URL rules dynamically from an Excel/Google Sheets database
- [ ] Add typosquatting detection (Levenshtein distance against known brands)
- [ ] Add punycode/homograph attack detection
- [ ] Add subdomain depth scoring
- [ ] Integrate external threat intelligence APIs (e.g. Google Safe Browsing)
- [ ] User report feedback loop to improve detection over time
- [ ] Publish to Chrome Web Store

---

## 👥 Team

Built at **HackHazard** by a three-member team with focus areas in cybersecurity, backend development, and browser extension engineering.

---
