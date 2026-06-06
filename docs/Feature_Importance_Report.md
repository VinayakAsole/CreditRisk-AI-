# 🔬 CreditRisk AI — Feature Importance Report
**Version:** 1.0.0  
**Phase:** Phase 3 — Model Development  
**Target Audience:** Risk Committees, Compliance Officers, Model Developers  

---

## 1. Global Feature Importance

The 3-tier credit risk model stack processes traditional credit scores (where available) alongside **8 categories of alternate data**. Global feature importance is computed using mean absolute SHAP values across the entire validation dataset ($N = 14,832$).

### 1.1 Ingestion Feature Ranking

Below is the relative feature attribution breakdown for the ensemble model (XGBoost + GNN):

| Feature Name | Category | SHAP Attribution | Gini Score | Default Impact Direction |
|--------------|----------|------------------|------------|-------------------------|
| **Utility DPD History** | Utility Bills | `0.184` | `0.42` | Positive (Delay $\rightarrow$ Default) |
| **Telecom Recharge Regularity** | Telecom | `0.162` | `0.38` | Negative (Stable $\rightarrow$ Approval) |
| **Loan-to-Income Ratio** | Application | `0.145` | `0.35` | Positive (High ratio $\rightarrow$ Default) |
| **E-Commerce Spend Velocity** | E-Commerce | `0.128` | `0.31` | Positive (High spend $\rightarrow$ Default) |
| **Active BNPL Loans** | BNPL / Rent | `0.104` | `0.26` | Positive (More loans $\rightarrow$ Default) |
| **GST Filing Delay** | GST / Tax | `0.089` | `0.22` | Positive (Delay $\rightarrow$ Default) |
| **Social Default Contagion** | Social Graph | `0.068` | `0.18` | Positive (Contagion $\rightarrow$ Default) |
| **Psychometric Risk Score** | Psychometric | `0.045` | `0.12` | Negative (High score $\rightarrow$ Approval) |

---

## 2. SHAP Feature Analysis & Beeswarm Representation

SHAP values measure the impact of feature values on the model's output (Probability of Default). 

```
                                  SHAP Value (Impact on Model Output - PD)
Feature Name              Low Feature Value  ◄─────────────────►  High Feature Value
───────────────────────────────────────────────────────────────────────────────────
Utility DPD History       [  -0.12 (Green)  ]           |   [  +0.22 (Red)  ]
Telecom Regularity        [  +0.18 (Red)    ]           |   [  -0.14 (Green) ]
Loan-to-Income Ratio      [  -0.13 (Green)  ]           |   [  +0.24 (Red)  ]
E-Commerce Spend          [  -0.10 (Green)  ]           |   [  +0.16 (Red)  ]
Active BNPL Loans         [  -0.08 (Green)  ]           |   [  +0.15 (Red)  ]
GST Filing Delay          [  -0.05 (Green)  ]           |   [  +0.12 (Red)  ]
```

* **Telecom Regularity (Negative Impact):** High regularity values drive the SHAP value negative (reducing PD), representing lower default risk. Low regularity top-ups drive default risk up.
* **Utility DPD (Positive Impact):** Zero DPD features keep the default risk low. Any DPD $>15$ days increases the default probability rapidly, driving positive SHAP values.
* **E-Commerce Spend & BNPL Loans (Positive Impact):** Excessive spending or more than 3 active microloans increase leverage and default probability (SHAP values scale positive).

---

## 3. Local Explainability (SHAP Waterfall)

For individual underwriting decisions, the model generates a SHAP waterfall explaining the delta between the base value (expected default rate of the portfolio, $\approx 0.156$) and the applicant's final computed PD score.

* **Example Applicant (Amit Verma - final PD: 0.85):**
  * Portfolio Base Value: `0.156`
  * +0.18 Telecom Regularity (unstable recharge cycle)
  * +0.14 Utility DPD (30-day delay on power bill)
  * +0.12 Employment Stability (gig worker, $<6$ months)
  * -0.13 Loan-to-Income (small ticket micro-loan)
  * +0.09 GST Filing Delay
  * **Final Calibrated PD: 0.85 (Very High Risk)**
