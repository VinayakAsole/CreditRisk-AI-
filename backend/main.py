"""
CreditRisk AI — FastAPI Model Serving Backend
Phase 6: Model Serving with Docker + Kubernetes
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import uvicorn
import json
import time
import uuid
from datetime import datetime

app = FastAPI(
    title="CreditRisk AI — PD Scoring API",
    description="Probability of Default scoring using alternate data (XGBoost + GNN ensemble)",
    version="3.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response Models ──────────────────────────────────────────────────

class AlternateDataConsent(BaseModel):
    telecom: bool = True
    utility: bool = True
    ecommerce: bool = True
    psychometric: bool = False
    gst: bool = True
    social_graph: bool = True

class PDScoringRequest(BaseModel):
    applicant_id: str = Field(..., description="Unique applicant identifier")
    full_name: str
    pan_number: str
    mobile: str
    loan_amount: float = Field(..., gt=0, description="Loan amount in INR")
    loan_purpose: str = Field(..., description="Personal/Business/Home/Vehicle/Education/Gold")
    employment_type: str = Field(..., description="Salaried/Self-Employed/Gig Worker/SME Owner/Farmer")
    alternate_data_consent: AlternateDataConsent = AlternateDataConsent()
    bureau_score: Optional[int] = None  # CIBIL / Experian

class SHAPFeature(BaseModel):
    feature_name: str
    shap_value: float
    feature_value: str

class PDScoringResponse(BaseModel):
    request_id: str
    applicant_id: str
    pd_score: float = Field(..., ge=0.0, le=1.0, description="Probability of Default (0=No Default, 1=Default)")
    risk_band: str = Field(..., description="Low / Moderate / High / Very High")
    recommended_action: str
    risk_premium_bps: int = Field(..., description="Risk premium in basis points")
    confidence: float
    model_version: str
    shap_features: List[SHAPFeature]
    alternate_data_signals: Dict[str, str]
    scored_at: str
    latency_ms: float

class BatchScoringRequest(BaseModel):
    applicants: List[PDScoringRequest]
    priority: str = "normal"  # normal / urgent

class ModelHealthResponse(BaseModel):
    status: str
    model_version: str
    auroc: float
    ks_statistic: float
    psi: float
    brier_score: float
    last_retrained: str
    next_scheduled_retrain: str
    champion_model: str
    challenger_model: str
    api_latency_p50_ms: float
    api_latency_p99_ms: float
    requests_last_24h: int

class ScoreMigrationAlert(BaseModel):
    alert_id: str
    borrower_id: str
    borrower_name: str
    previous_band: str
    current_band: str
    bands_migrated: int
    previous_pd: float
    current_pd: float
    triggered_at: str
    severity: str  # CRITICAL / HIGH / MEDIUM

class RetrainingJobRequest(BaseModel):
    trigger: str = Field(..., description="manual / scheduled / drift_triggered / challenger")
    model_type: str = Field(..., description="xgboost / lightgbm / gnn / ensemble")
    notes: Optional[str] = None

# ── Utility ────────────────────────────────────────────────────────────────────

def get_risk_band(pd: float) -> str:
    if pd < 0.30: return "Low"
    if pd < 0.50: return "Moderate"
    if pd < 0.70: return "High"
    return "Very High"

def get_recommendation(band: str) -> tuple:
    return {
        "Low":       ("Auto Approve", 0),
        "Moderate":  ("Conditional Approve", 150),
        "High":      ("Manual Review Required", 300),
        "Very High": ("Reject / Escalate to Risk Committee", 0),
    }[band]

# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"service": "CreditRisk AI PD Scoring API", "version": "3.2.0", "status": "healthy"}

@app.get("/health", response_model=ModelHealthResponse, tags=["Health"])
def model_health():
    """Real-time model health metrics — Evidently AI style monitoring"""
    return ModelHealthResponse(
        status="healthy",
        model_version="XGBoost-v3.2",
        auroc=0.782,
        ks_statistic=0.38,
        psi=0.089,
        brier_score=0.142,
        last_retrained="2026-03-01T00:00:00Z",
        next_scheduled_retrain="2026-07-01T00:00:00Z",
        champion_model="XGBoost v3.2 (AUROC: 0.782)",
        challenger_model="LightGBM v1.5 (AUROC: 0.793) — Testing",
        api_latency_p50_ms=124.3,
        api_latency_p99_ms=410.7,
        requests_last_24h=14832,
    )

@app.post("/v1/score", response_model=PDScoringResponse, tags=["Scoring"])
def score_applicant(request: PDScoringRequest):
    """
    Real-time PD scoring using XGBoost + GNN ensemble.
    Alternate data fetched from consented sources.
    SHAP explainability included in response.
    Target latency: < 500ms
    """
    t0 = time.time()

    # Simulate model inference (replace with actual model.predict())
    import random
    pd_score = round(random.uniform(0.05, 0.92), 4)

    band = get_risk_band(pd_score)
    action, premium_bps = get_recommendation(band)

    shap_features = [
        SHAPFeature(feature_name="Telecom Regularity", shap_value=+0.18, feature_value="HIGH"),
        SHAPFeature(feature_name="Utility Payment History", shap_value=+0.14, feature_value="ON_TIME"),
        SHAPFeature(feature_name="Employment Stability", shap_value=+0.12, feature_value="3+ YEARS"),
        SHAPFeature(feature_name="Loan-to-Income Ratio", shap_value=-0.13, feature_value="42%"),
        SHAPFeature(feature_name="DPD History (Bureau)", shap_value=-0.16, feature_value="1 INSTANCE"),
        SHAPFeature(feature_name="E-Commerce Spend Pattern", shap_value=-0.11, feature_value="HIGH"),
        SHAPFeature(feature_name="BNPL Usage Score", shap_value=-0.08, feature_value="MODERATE"),
        SHAPFeature(feature_name="GST Filing Regularity", shap_value=+0.09, feature_value="QUARTERLY"),
        SHAPFeature(feature_name="Geographic Mobility", shap_value=+0.06, feature_value="STABLE"),
        SHAPFeature(feature_name="Psychometric Score", shap_value=+0.07, feature_value="72/100"),
    ]

    alt_signals = {}
    if request.alternate_data_consent.telecom:    alt_signals["telecom"] = "FETCHED"
    if request.alternate_data_consent.utility:    alt_signals["utility"] = "FETCHED"
    if request.alternate_data_consent.ecommerce:  alt_signals["ecommerce"] = "FETCHED"
    if request.alternate_data_consent.gst:        alt_signals["gst"] = "FETCHED"
    if request.alternate_data_consent.social_graph: alt_signals["social_graph"] = "FETCHED"
    if request.alternate_data_consent.psychometric: alt_signals["psychometric"] = "FETCHED"

    latency = round((time.time() - t0) * 1000, 2)

    return PDScoringResponse(
        request_id=str(uuid.uuid4()),
        applicant_id=request.applicant_id,
        pd_score=pd_score,
        risk_band=band,
        recommended_action=action,
        risk_premium_bps=premium_bps,
        confidence=0.942,
        model_version="XGBoost-v3.2",
        shap_features=shap_features,
        alternate_data_signals=alt_signals,
        scored_at=datetime.utcnow().isoformat() + "Z",
        latency_ms=latency,
    )

@app.post("/v1/score/batch", tags=["Scoring"])
def batch_score(request: BatchScoringRequest, background_tasks: BackgroundTasks):
    """Batch PD scoring for up to 10,000 applicants. Runs as background job."""
    job_id = str(uuid.uuid4())
    return {
        "job_id": job_id,
        "status": "queued",
        "applicant_count": len(request.applicants),
        "priority": request.priority,
        "estimated_completion_seconds": len(request.applicants) * 0.15,
        "results_endpoint": f"/v1/score/batch/{job_id}/results",
    }

@app.get("/v1/monitoring/psi", tags=["Monitoring — Evidently AI"])
def get_psi_report():
    """
    Evidently AI-style PSI report.
    Population Stability Index per alternate data feature.
    Alert threshold: PSI > 0.10
    """
    return {
        "report_date": datetime.utcnow().isoformat() + "Z",
        "overall_psi": 0.089,
        "status": "WARNING",  # GREEN < 0.05, WARNING 0.05-0.10, RED > 0.10
        "threshold_warning": 0.05,
        "threshold_critical": 0.10,
        "feature_psi": [
            {"feature": "E-Commerce Spend", "psi": 0.12, "status": "RED",     "drift": "Moderate"},
            {"feature": "Telecom Recharge",  "psi": 0.04, "status": "GREEN",   "drift": "Low"},
            {"feature": "BNPL Usage",        "psi": 0.09, "status": "WARNING", "drift": "Moderate"},
            {"feature": "Utility Bill Delay","psi": 0.03, "status": "GREEN",   "drift": "Low"},
            {"feature": "GST Filing",        "psi": 0.05, "status": "WARNING", "drift": "Low"},
            {"feature": "Social Graph Score","psi": 0.02, "status": "GREEN",   "drift": "None"},
        ],
        "recommendation": "Review E-Commerce feature distribution. Consider re-binning or retraining if PSI exceeds 0.20.",
        "powered_by": "Evidently AI (simulated)",
    }

@app.get("/v1/monitoring/score-migration", tags=["Monitoring — Evidently AI"])
def get_score_migration():
    """
    Score band migration matrix (Fiddler-style).
    ALERT: If a borrower migrates > 5 bands, trigger immediate review.
    """
    return {
        "period": "May 2026 → Jun 2026",
        "total_accounts": 14832,
        "migration_matrix": {
            "Low → Low":           8940,
            "Low → Moderate":       312,
            "Low → High":            28,  # ⚠ Unexpected
            "Moderate → Moderate": 3841,
            "Moderate → High":      427,
            "Moderate → Low":       189,
            "High → High":         1892,
            "High → Very High":     341,
            "High → Moderate":      215,
            "Very High → Very High": 892,
            "Very High → High":     143,
        },
        "score_migration_alerts": [
            {
                "alert_id": "SMA-001", "borrower_id": "CR-9921",
                "borrower_name": "Amit Verma",
                "previous_band": "Moderate", "current_band": "Very High",
                "bands_migrated": 6,  # > 5 threshold → CRITICAL ALERT
                "previous_pd": 0.28, "current_pd": 0.85,
                "triggered_at": "2026-06-03T08:14:22Z",
                "severity": "CRITICAL",
            },
            {
                "alert_id": "SMA-002", "borrower_id": "CR-7723",
                "borrower_name": "Rajesh Patil",
                "previous_band": "High", "current_band": "Very High",
                "bands_migrated": 3,
                "previous_pd": 0.61, "current_pd": 0.91,
                "triggered_at": "2026-06-02T14:30:10Z",
                "severity": "HIGH",
            },
        ],
        "alert_threshold_bands": 5,
        "alerts_triggered": 1,
    }

@app.post("/v1/retrain", tags=["MLOps — Champion-Challenger"])
def trigger_retraining(request: RetrainingJobRequest):
    """
    Monthly champion-challenger retraining pipeline.
    Triggers: Manual / Scheduled / Drift-triggered (PSI > 0.10) / Challenger promotion
    """
    job_id = str(uuid.uuid4())
    return {
        "job_id": job_id,
        "trigger": request.trigger,
        "model_type": request.model_type,
        "status": "initiated",
        "pipeline_stages": [
            {"stage": "Data extraction",          "status": "pending", "eta_minutes": 5},
            {"stage": "Feature engineering",       "status": "pending", "eta_minutes": 15},
            {"stage": "Model training",            "status": "pending", "eta_minutes": 45},
            {"stage": "SHAP calibration",          "status": "pending", "eta_minutes": 10},
            {"stage": "Validation (AUROC/KS/PSI)", "status": "pending", "eta_minutes": 20},
            {"stage": "Champion-challenger test",  "status": "pending", "eta_minutes": 30},
            {"stage": "Approval & deployment",     "status": "pending", "eta_minutes": 5},
        ],
        "estimated_total_minutes": 130,
        "deployment_strategy": "Blue-Green (Kubernetes)",
        "initiated_at": datetime.utcnow().isoformat() + "Z",
        "notes": request.notes,
    }

@app.get("/v1/retrain/schedule", tags=["MLOps — Champion-Challenger"])
def retraining_schedule():
    """Monthly champion-challenger retraining schedule"""
    return {
        "schedule": "Monthly (1st of every month at 00:00 UTC)",
        "cron": "0 0 1 * *",
        "last_run": "2026-06-01T00:00:00Z",
        "next_run": "2026-07-01T00:00:00Z",
        "history": [
            {"run_date": "2026-06-01", "trigger": "scheduled", "result": "champion_unchanged", "auroc_delta": -0.004},
            {"run_date": "2026-05-01", "trigger": "scheduled", "result": "champion_unchanged", "auroc_delta": -0.001},
            {"run_date": "2026-04-01", "trigger": "drift_triggered", "result": "challenger_promoted", "auroc_delta": +0.012},
            {"run_date": "2026-03-01", "trigger": "scheduled", "result": "champion_unchanged", "auroc_delta": -0.002},
        ],
        "auto_promote_threshold": {"min_auroc_gain": 0.005, "max_psi_increase": 0.01},
    }

@app.post("/v1/alerts/score-migration", tags=["Alerts"])
def configure_score_migration_alert(threshold_bands: int = 5):
    """
    Configure score migration alert.
    Default: score migration > 5 bands triggers immediate review + notification.
    """
    return {
        "alert_type": "SCORE_MIGRATION",
        "threshold_bands": threshold_bands,
        "action": "IMMEDIATE_REVIEW",
        "notifications": ["risk_officer@bank.com", "model_team@bank.com", "pagerduty_webhook"],
        "sla_response_hours": 4,
        "status": "active",
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, workers=4)
