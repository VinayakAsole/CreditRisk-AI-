# CreditRisk AI — Solution Approach & System Architecture
### Defaulter Intelligence Portal & Interactive Telemetry Dashboard

---

## 1. Executive Summary
CreditRisk AI is an advanced risk mitigation and telemetry platform designed to help financial institutions track, manage, and engage with high-risk defaulters. The platform replaces static spreadsheets with a dynamic, real-time reactive interface that integrates alternate data streams, geographical risk heatmaps, and a fully connected contact timeline synced to a secure cloud database.

---

## 2. The Problem Statement
Managing non-performing assets (NPAs) and high-risk loan defaulters is typically slowed down by:
1. **Siloed and Static Data**: Risk officers lack real-time visibility into borrower contact histories and global exposure hotspots.
2. **Fragile Sync & UI Lag**: Staged network updates often freeze user interfaces, reducing officer productivity.
3. **Weak Visual Telemetry**: Flat tables make it difficult to visualize regional density and connections between defaulters.

---

## 3. The Solution Approach

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

The system uses a modern, three-tier architecture:
- **Client Tier**: A React web application utilizing HTML5 Canvas for 3D physics rendering and Framer Motion for premium user interface transitions.
- **Real-Time Persistence Tier**: Serverless Firebase Firestore Database syncing contact events and status updates instantly.
- **Analytics & ML Tier**: A Python FastAPI backend exposing metrics (Population Stability Index, drift analysis, model retraining schedules).

---

## 4. Key Implemented Features

### 📡 1. Real-Time Defaulter Intelligence Portal
* **Live Timelines**: Risk officers can log calls, emails, SMS, WhatsApps, or field visits.
* **Resilient Non-Blocking UX**: Form submissions execute Firestore writes in the background. The user interface updates instantly without waiting for network roundtrips, eliminating app freezes.
* **Auto-Deduplication**: Uses client-side generated UUIDs to resolve latency compensation, merging local additions and remote updates seamlessly with no double entries.
* **Firestore Document Naming**: Automatically creates physical collections under the borrower's name in Firestore, making database tables readable in the Firebase Console.

### 🌐 2. 3D Defaulter Risk Globe
* **Interactive Geometry**: Renders a glassmorphic 3D globe using vanilla Canvas 2D math, reducing the bundle size compared to heavy WebGL libraries.
* **Risk Contagion Bezier Arcs**: Renders curved quadratic arcs between a selected city and other global clusters with animated light particles, tracing potential default contagion patterns.
* **Search & Auto-Rotate Centering**: A search bar filters cities and triggers easing rotation angles to bring the selected city smoothly to the front.
* **Visual Themes**: Toggle between **Blueprint** (cyber cyan), **Magma** (threat red/orange), and **Matrix** (green terminal) to suit the environment.
* **Embedded Borrower Lists**: Inspecting a city cluster shows the specific list of defaulters in that region with quick links to track them.

---

## 5. Security & Deployment Best Practices
* **Credential Protection**: Implemented a `.env` pattern using Vite-prefixed environment variables.
* **Git Safety**: Configured `.gitignore` rules to block real API keys from being exposed to public repositories, using `.env.example` as a template.

---

### *How to save this document as a PDF:*
1. **VS Code**: Install the *Markdown PDF* extension, right-click this file, and select **Markdown PDF: Export (pdf)**.
2. **Browser**: Double-click this file or open it in a browser, click **Print (Ctrl + P)**, and select **Save as PDF**.
