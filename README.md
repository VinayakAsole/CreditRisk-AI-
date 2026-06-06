# CreditRisk AI — Defaulter Intelligence Portal & Telemetry Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://credit-risk-ai-three.vercel.app/)
[![React Version](https://img.shields.io/badge/react-19.x-blue.svg)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/vite-8.x-purple.svg)](https://vite.dev/)
[![FastAPI Version](https://img.shields.io/badge/FastAPI-0.x-green.svg)](https://fastapi.tiangolo.com/)

An advanced, production-grade FinTech risk observatory dashboard designed to score, track, and visualize high-risk borrower defaults in real-time. Built to empower risk officers with alternative data profiling and spatial contagion intelligence.

👉 **[Live Demo URL](https://credit-risk-ai-three.vercel.app/)**

---

## 📸 Dashboard Interface
![CreditRisk AI Dashboard Preview](./public/dashboard_preview.png)

---

## ⚡ Core Highlights & Features

### 🌐 1. Interactive 3D Defaulter Risk Globe
* **Geospatial Telemetry**: Visualizes default density and exposure metrics across geographical clusters on a fully interactive 3D globe rendered with custom math on a Canvas 2D context.
* **Risk Contagion Bezier Arcs**: Computes and draws curved Bezier contagion paths with animated particle glows connecting selected clusters, tracing structural liability exposure.
* **Auto-Rotate Centering & Search**: Integrates a search-zoom mechanism that automatically rotates the globe to focus on the selected city cluster.
* **Theme Skins**: Live toggle between **Blueprint** (cyber-blue), **Magma** (threat red/orange), and **Matrix** (grid green) visualization skins.
* **Embedded cluster lists**: Lists the actual defaulters residing in that cluster with quick-track router actions.

### 📡 2. Real-Time Defaulter Intelligence Portal
* **Live Firestore Timelines**: Connected to Firebase Firestore for real-time contact event logging (Calls, Emails, SMS, WhatsApps, and Field Visits).
* **Non-Blocking Asynchronous Sync**: Submitting a log starts the database write in the background, closing the modal instantly to prevent UI freezes.
* **Optimistic Deduplication**: Leverages client-generated event UUIDs to reconcile latency compensation, maintaining single, clean list entries.
* **Search & Filters**: Search directory by Name, PAN, Loan ID, or phone, with risk band filtering (Critical, High, Moderate, Low).

### 🤖 3. MLOps Monitoring observatory
* **Model Drift Telemetry**: Tracks live Population Stability Index (PSI) and feature drift logs (e.g. e-commerce spends, BNPL usage).
* **Autopilot Retraining**: Renders PSI warning and critical limits (e.g., auto-retrain triggers at PSI > 0.10) with policy configurations.
* **Incident History**: Incident table showing incident timestamps, severity levels, and resolution status.

---

## 🛠️ Tech Stack & Architecture

```
┌────────────────────────────────────────────────────────┐
│                      VITE FRONTEND                     │
│  (React, Framer Motion, HTML5 Canvas, Alternate Data)  │
└───────────┬───────────────────────────────┬────────────┘
            │                               │
    (REST API Calls)            (Real-Time Firestore Sync)
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│  FASTAPI PYTHON BACKEND│       │   FIREBASE FIRESTORE   │
│  (ML Models, PSI/drift│       │  (Defaulter Profiles,  │
│    telemetry, health) │       │   Contact Timelines)   │
└───────────────────────┘       └────────────────────────┘
```

* **Frontend**: React (v19) + Vite (v8) + Framer Motion (v12) for smooth spring animations.
* **Styles**: Custom CSS tokens (glassmorphism cards, cyber neon palettes, custom scrollbars).
* **Database**: Serverless Google Cloud Firestore.
* **Backend API**: Python FastAPI (Model serving, drift telemetry calculations).
* **Ops**: Docker & Kubernetes configurations configured for scaling.

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/VinayakAsole/CreditRisk-AI-.git
cd h2
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root folder (see [`.env.example`](file:///c:/Users/LENOVO/Desktop/project%20for%20git/h/h2/.env.example)) and fill in your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run Locally
```bash
# Start Vite Frontend
npm run dev

# Start Python Backend
python backend/main.py
```
