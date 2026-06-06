# 📖 CreditRisk AI — Alternate Data Dictionary
**Version:** 1.0.0  
**Phase:** Phase 2 — Alternate Data Pipeline  
**Target Audience:** Data Scientists, ML Engineers, Risk Analysts  

---

## 1. Overview

This data dictionary outlines the specific alternate features computed by the ingestion pipelines and served through the **Feast Feature Store**. These variables represent the primary features driving the ensemble XGBoost + GNN Probability of Default (PD) scoring model.

---

## 2. Alternate Features Specifications

### 2.1 Telecom / Mobile Features
* **Update Frequency:** Hourly
* **Source:** Telecom Partner Billing Gateway

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `telecom_recharge_regularity_score` | Float | Ratio of recharge events matching regular cycles | `0.0` – `1.0` | Close to `1.0` = high financial stability; close to `0.0` = cash-flow irregularity. |
| `telecom_avg_topup_amount_30d` | Float | Average mobile top-up amount in INR (last 30 days) | `₹10` – `₹5,000` | Higher values correlate with higher disposable income. |
| `telecom_sim_swap_count_180d` | Int | Number of SIM card change events in last 180 days | `0` – `10+` | High swap count is a strong fraud indicator. |
| `telecom_roaming_index` | Float | Percentage of time device registered in roaming networks | `0.0` – `1.0` | Higher values suggest high geographic mobility. |

---

### 2.2 Utility Bills Features
* **Update Frequency:** Daily
* **Source:** BBPS (Bharat Bill Payment System)

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `utility_max_dpd_12m` | Int | Maximum Days Past Due on any utility bill (last 12 months) | `0` – `360+` | Values $> 30$ are strong leading indicators of default. |
| `utility_bill_paid_on_time_ratio` | Float | Ratio of bills paid on or before due date (last 12 months) | `0.0` – `1.0` | Low ratio indicates active cash-flow constraints. |
| `utility_monthly_avg_bill_amount` | Float | Avg monthly billing aggregate for electricity, water, gas | `₹0` – `₹50,000` | Indicator of household scale and recurring expenses. |

---

### 2.3 E-Commerce Spend Features
* **Update Frequency:** Real-time / Session-based
* **Source:** Checkout API / Marketplace Aggregators

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `ecommerce_monthly_spend_ratio` | Float | Total e-commerce spend divided by declared monthly income | `0.0` – `1.5` | Ratio $> 0.60$ suggests high leverage or lifestyle creep. |
| `ecommerce_order_cancellation_rate` | Float | Percentage of ordered items cancelled or returned (cash-on-delivery) | `0.0` – `1.0` | High returns indicate behavioral inconsistency. |
| `ecommerce_emi_purchase_count_90d` | Int | Number of items purchased using checkout micro-loans (last 90 days) | `0` – `20+` | Higher values suggest reliance on short-term credit. |
| `ecommerce_lifestyle_luxury_spend_index`| Float | Percentage of purchases categorized as luxury/non-essential | `0.0` – `1.0` | Higher values show discretionary spending power. |

---

### 2.4 Digital Footprint Features
* **Update Frequency:** On Application Ingestion
* **Source:** Mobile App SDK Metadata

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `device_os_stability_index` | Float | Number of system crashes divided by total sessions | `0.0` – `0.1` | Higher values correlate with unstable device usage patterns. |
| `active_financial_apps_count` | Int | Count of active lending, micro-credit, or portfolio tracking apps | `0` – `15` | $>5$ apps often correlates with default risk ("loan stacking"). |

---

### 2.5 Psychometric Features
* **Update Frequency:** On Application Ingestion
* **Source:** Gamified Risk Assessment API

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `psychometric_risk_aversion_score` | Float | Quantified indicator of financial planning and cautiousness | `0` – `100` | Higher scores correlate with low default probability. |
| `psychometric_cognitive_consistency` | Float | Measures response consistency throughout behavioral testing | `0.0` – `1.0` | Low consistency suggests erratic behavior or automated fraud bots. |

---

### 2.6 Social Graph Features
* **Update Frequency:** Daily
* **Source:** Co-signer & Contact Graph Analysis

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `social_defaulter_connection_count` | Int | Number of direct co-applicants or guarantors who are active NPA | `0` – `5+` | Higher counts suggest community risk contagion. |
| `social_network_density_coefficient` | Float | Connectivity index of borrower's immediate credit network | `0.0` – `1.0` | Higher density indicates stable, interconnected social circles. |

---

### 2.7 Rental / BNPL Features
* **Update Frequency:** Daily
* **Source:** Rent Portals & BNPL Ledgers

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `rental_dpd_history_6m` | Int | Accumulated days late on rent payments in the last 6 months | `0` – `180` | Rent delays are strong indicators of primary liquidity issues. |
| `bnpl_active_loans_count` | Int | Count of active micro-payment loans currently open | `0` – `10` | High count shows micro-leverage risk. |

---

### 2.8 GST / Tax Filing Features
* **Update Frequency:** Monthly
* **Source:** GSTN Gateway (Goods and Services Tax Network)

| Feature Name | Type | Description | Value Range | Signal Interpretation |
|--------------|------|-------------|-------------|-----------------------|
| `gst_sales_volatility_coefficient` | Float | Volatility in GSTR1 sales reports over the last 12 months | `0.0` – `2.0` | High volatility suggests seasonal or unstable business revenue. |
| `gst_filing_delay_days_avg` | Float | Average delay (in days) past the GSTR1 monthly filing deadline | `0` – `60+` | Delay $> 10$ days suggests poor bookkeeping or cash-flow stress. |
| `gst_tax_compliance_status` | String | Classification of GST compliance | `GREEN`, `YELLOW`, `RED` | `RED` status triggers immediate underwriting review. |
