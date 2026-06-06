# 🗃️ CreditRisk AI — Model Card
### 3-Tier Credit Risk Management Ensemble Stack (XGBoost + GNN)
**Version:** 3.2.0  
**Released:** June 2026  
**Developers:** CreditRisk AI Data Science Team  

---

## 1. Model Details

* **Type:** 3-Tier Credit Scoring Ensemble
  * **Tier 1 (Base Scorecard):** Logistic Regression on Weight of Evidence (WoE) binned traditional + telecom attributes. (Focus: explainability, compliance).
  * **Tier 2 (ML Engine):** XGBoost Classifier on 104 alternate features. (Focus: high discriminatory accuracy).
  * **Tier 3 (Graph Deep Learning):** Graph Neural Network (GNN) on co-signer and guarantor relationship graphs. (Focus: network risk, social default contagion, fraud rings).
* **Target Variable:** 90-DPD (Days Past Due) default label within a 12-month performance window.
* **Output:** Calibrated Probability of Default (PD) score (`0.0` to `1.0`) and mapped Risk Band (`Low`, `Moderate`, `High`, `Very High`).

---

## 2. Intended Use

* **Primary Users:** Regulated Banks, NBFCs, FinTech credit risk officers, and underwriters.
* **Intended Application:** Underwriting and credit limit decisions for micro-business, SME, consumer BNPL, and thin-file/new-to-credit personal loans.
* **Out-of-Scope Uses:** Underwriting large commercial loans, mortgages, or sovereign debt structures.

---

## 3. Factors & Target Populations

The model is segmented to handle different target demographics:
* **Thin-File / New-to-Credit (NTC):** Underwritten predominantly on Tier 2 and Tier 3 alternate data features. (Telecom, Utility, E-commerce, Psychometrics).
* **Thick-File / Bureau Customers:** Underwritten on traditional bureau records (CIBIL) with alternate data acting as a risk multiplier or overlay.

---

## 4. Evaluation Metrics & Performance Summary

Model validation is executed during Phase 4 across all segments:

* **Discriminatory Power (AUROC):** `0.782` (target $\geq 0.75$)
* **Rank Ordering (KS Statistic):** `0.380` (target $\geq 0.35$)
* **Calibration (Brier Score):** `0.142` (target $< 0.15$)
* **Population Stability Index (PSI):** `0.089` (target $< 0.10$ - approaching warning threshold)
* **Fairness (Disparate Impact Ratio):** `0.84` (target $\geq 0.80$ - checked across rural vs urban cohorts)

---

## 5. Training & Evaluation Datasets

* **Training Data:** Simulated and historical partner datasets containing 1.2M anonymized customer profiles from June 2024 to May 2025.
* **Evaluation Data:** Out-of-time (OOT) test validation dataset ($N = 14,832$) compiled from credit cycles in Q1 2026.
* **Anonymization:** Names, PAN numbers, and contact details are completely masked via salted SHA-256 digests.

---

## 6. Ethical Considerations & Limitations

* **Fairness Check:** Regular audits are run on geographic (rural vs urban) and device-type parameters to prevent biases against lower-income demographics using older operating systems.
* **Data Bias:** Models trained on urban checkout data (e-commerce) may over-penalize cash-dominant rural micro-entrepreneurs. Rules-based fallbacks are defined for such cohorts.
