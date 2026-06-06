# 📡 CreditRisk AI — Alternate Data Strategy Document
**Version:** 1.0.0  
**Phase:** Phase 1 & 2 — Alternate Data Pipeline & Strategy  
**Target Audience:** Data Engineering, Data Science, Compliance Officers  

---

## 1. Scope & Strategy

This document defines the ingestion, mapping, feature extraction, and compliance strategy for **alternate (non-traditional) data sources** used by the CreditRisk AI scoring engine. By overlaying behavioral, digital, and utility transaction signals, the model achieves a high AUROC even for borrowers without credit bureau history (thin-file applicants).

---

## 2. Ingestion Matrix & Signal Mapping

We have integrated 8 primary categories of alternate data. Below is the mapping of data points to their default risk interpretations:

| Category | Ingestion Endpoint / Source | Target Features | Signal for Default Risk |
|----------|----------------------------|-----------------|------------------------|
| **Telecom / Mobile** | Telecommunication CDR (Call Detail Record) APIs | Recharge regularity, roaming index, top-up velocity | Frequent short-term recharges or drop in top-up velocity suggests liquidity stress. |
| **Utility Bills** | Bharat Bill Payment System (BBPS) / Utility APIs | Days past due on electricity, gas, water | Delayed bill payments are the strongest leading indicator of cash-flow stress. |
| **E-Commerce** | Merchant checkout / order APIs | Average ticket size, monthly spend, purchase category | Shift from premium to survival goods or frequent EMI purchases suggests debt loading. |
| **Digital Footprint** | Mobile App SDK Metadata | Device brand, operating system stability, active financial apps | Stable OS usage and presence of premium applications correlate with income stability. |
| **Psychometric** | Visual gamified assessment tool | Risk aversion score, planning index, cognitive consistency | Low planning index scores correlate with higher default rates on microloans. |
| **Social Graph** | Co-applicant registry & guarantor connections | Shared default nodes, connection density | Contact with active defaulters indicates high community contagion default risk. |
| **Rental / BNPL** | Property management systems & BNPL merchants | Rent-to-income ratio, BNPL repayment cycles | Over-reliance on BNPL micro-credits suggests under-banking and high leverage. |
| **GST / Tax Filing** | GSTN (Goods and Services Tax Network) API | Monthly filing delay, sales-to-expense volatility | Irregular GST filing or volatile quarterly sales indicate business instability. |

---

## 3. Data Flow & Feature Store Scaffolding

To feed the real-time scoring engine, alternate data streams are orchestrated through a unified ETL pipeline:

```
[ Alternate Data APIs ] ──→ [ Ingestion Workers ] ──→ [ Kafka Ingestion Topic ]
                                                              │
                                                              ▼
[ Feast Feature Store ] ←── [ Spark Streaming ETL ] ◄─────────┘
        │
        ├─ Offline Store (Parquet/S3) ──→ Model Training (XGBoost)
        │
        └─ Online Store (Redis Cache)  ──→ Live Scoring API (FastAPI)
```

1. **Ingestion Layer:** Webhooks and polling workers request data from partners upon receiving customer consent.
2. **Streaming & Ingestion:** Apache Kafka streams raw data payloads to ensure high availability and event sequencing.
3. **ETL & Feature Calculation:** Apache Spark computes rolling window features (e.g., `utility_avg_dpd_90d`, `ecommerce_spend_ratio_30d`).
4. **Feature Store (Feast):** Store features in a double-sided repository:
   * **Online Store (Redis):** Latency $< 10\text{ ms}$ for real-time model inference.
   * **Offline Store (Amazon S3 / Parquet):** Historical logs for model training and calibration.

---

## 4. Privacy, Security, & Regulatory Compliance

Alternate data processing must strictly adhere to regional privacy regulations (India's **DPDP Act 2023**, European **GDPR**):

### 4.1 Consent Architecture
* **Revocability:** Users can revoke access to alternate data. Upon revocation, the offline store must delete/anonymize all historical records associated with the user's alternate features.
* **Single-Purpose Ingestion:** Data fetched during a credit application must only be used for underwriting and auditing that specific application.

### 4.2 Security Standards
* **Encryption-in-Transit:** All partner API handshakes require TLS 1.3 with OAuth 2.0 mutual authentication.
* **Encryption-at-Rest:** All data stored in PostgreSQL and Redis is encrypted using AES-256 keys managed by Cloud HSM services.
* **Anonymization:** Feature stores do not contain PII (Personally Identifiable Information). Applicant PAN numbers and names are hashed (`SHA-256` with salt) before storage. Only the core application database stores decrypted PII for KYC matching.
