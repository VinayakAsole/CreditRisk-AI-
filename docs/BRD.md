# 🏦 CreditRisk AI — Business Requirements Document (BRD)
### Project: Alternate Data Credit Scoring & Defaulter Tracking Engine
**Version:** 1.0.0  
**Phase:** Phase 1 — Foundation & Strategy  
**Target Audience:** Risk Management, Business Stakeholders, Compliance & Model Validation Teams  

---

## 1. Executive Summary & Objective

Traditional credit scoring models rely heavily on bureau records (e.g., CIBIL in India, Experian). This leaves a massive population segment classified as **"thin-file" or "new-to-credit" (NTC)**, including gig workers, micro-merchants, rural farmers, and young professionals.

The objective of **CreditRisk AI** is to build a credit risk management platform utilizing **alternate data** (telecom, utilities, e-commerce, digital footprint, psychometrics, and social graphs) to compute a calibrated **Probability of Default (PD)**. Additionally, the platform provides a **Defaulter Intelligence Portal** to search, locate, and track delinquent borrowers through geo-spatial indicators and network contagion analysis.

---

## 2. Business Scope & Risk Appetite

### 2.1 Scope of Loan Products
The scoring engine will support underwriting decisions for the following product lines:
* **Micro-Business / SME Loans:** Cash-flow underwriting via GST data and cash registry signals.
* **Gig Economy Loans:** Rapid-underwriting products (e.g., digital-cash loans) for delivery riders, freelancers, and platform workers based on telecom and e-commerce transactions.
* **Consumer Durable / BNPL (Buy-Now-Pay-Later):** Instant credit checks at point-of-sale based on app footprint and psychometric scores.
* **Personal Loans:** Traditional unsecured loans calibrated with alternate data overlays for marginal approval decisions.

### 2.2 Risk Appetite Framework
Our organization operates under a controlled risk appetite seeking to maximize NTC credit access while keeping Portfolio-at-Risk (PAR) stable:
* **Target Default Rate:** Keep overall portfolio 90-DPD default rate below **3.5%**.
* **Risk Appetite Segment Rules:**
  * **Low Risk (PD < 0.30):** Straight-Through Processing (STP) auto-approval.
  * **Moderate Risk (0.30 ≤ PD < 0.50):** Conditional approval with interest rate premiums (+150 bps) or lower credit limits.
  * **High Risk (0.50 ≤ PD < 0.70):** Flag for manual underwriter review.
  * **Very High Risk (PD ≥ 0.70):** Automatic rejection and notification of collection-risk monitoring.

---

## 3. Key Performance Indicators (KPIs)

To evaluate the success of the model and platform, the following target metrics must be validated during Phase 4 and post-deployment in Phase 6:

| Metric | Target Value | Business Rationale |
|--------|--------------|--------------------|
| **Model AUROC** | $\geq 0.75$ | High discriminatory power to separate good and bad borrowers |
| **KS Statistic** | $\geq 0.35$ | Maximize separation distance between default and non-default distributions |
| **Recall (Sensitivity)** | $\geq 65\%$ at 20% approval | Identify at least 65% of potential defaults before underwriting |
| **API Latency (P50)** | $< 150\text{ ms}$ | Ensure instant digital approval support |
| **API Latency (P99)** | $< 500\text{ ms}$ | Meet SLA limit for embedded finance partners |
| **False Positive Rate** | $< 15\%$ | Minimize rejection of creditworthy thin-file applicants |
| **Defaulter Tracking Yield** | $+30\%$ vs manual | Improve collections efficiency through geo-spatial and network insights |

---

## 4. Functional Specifications

The platform must support five primary functional areas:
1. **Interactive Command Center (Dashboard):** Portfolio-level visualization of metrics, risk distribution, alert volumes, and a real-time feed of applications.
2. **PD Scoring Engine:** Real-time scoring interface with automated alternate data consent verification, SHAP explainability charts, calibrated default risk bands, and collection premiums.
3. **Defaulter Intelligence Portal:** Multi-filter directory (PAN, ID, Location, Risk Level) showing outstanding collection timelines, recovery progression charts, and collections histories.
4. **3D Risk Globe:** WebGL-based geospatial visualization plotting active defaulter clusters on Indian urban and rural hubs.
5. **Model Observatory (MLOps Console):** MLOps dashboard tracking population drift (PSI), model decay (AUROC), Kubernetes service health, and monthly Champion-Challenger promotions.

---

## 5. Regulatory Compliance & RBI Norms

The engine complies with the Reserve Bank of India (RBI) guidelines on digital lending:
* **Explicit Customer Consent:** Alternate data can only be accessed with explicit, double-opt-in, single-use consent via toggle mechanisms in the applicant UI.
* **Explainability (DPDP Act):** Borrowers have the right to know why a credit decision was made. SHAP explainability metrics must be translated into plain English for the underwriting and audit teams.
* **Data Localization:** All raw alternate data streams, models, and outputs must be stored locally on servers within the sovereign borders of India.
* **No "First Loss Default Guarantee" (FLDG) Violations:** Scoring models must serve the regulated entity (Bank/NBFC) direct decisioning without outsourcing credit risk arbitrage.
