# ☸️ CreditRisk AI — Infrastructure Blueprint
**Version:** 1.0.0  
**Phase:** Phase 1 & 6 — Infrastructure & Serving  
**Target Audience:** Cloud Engineers, DevOps, MLOps, System Administrators  

---

## 1. Cloud Infrastructure Architecture

The platform is designed to be cloud-agnostic, running seamlessly on **AWS (EKS), Azure (AKS), or Google Cloud (GKE)**.

```
                    [ Cloud Ingress / Load Balancer ]
                                   │
                                   ▼
                       [ Kubernetes Ingress (Nginx) ]
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
        [ pd-scoring-api ]                    [ evidently-monitor ]
        (FastAPI - 3 Pods)                    (Dashboard - 1 Pod)
                │                                     │
                ├─────────────────────────────────────┤
                ▼                                     ▼
      [ redis-cache (1 Pod) ]               [ postgres-db (StatefulSet) ]
         (Online Features)                     (Audit Logs / Metadata)
                                                      ▲
                                                      │
                                           [ monthly-retrain-job ]
                                           (Kubernetes CronJob)
```

---

## 2. Containerization (Docker Spec)

The FastAPI serving backend is dockerized to ensure immutable deployments. The target container image runs on a slim Python 3.13 image, exposing port `8000`.

* **Docker Config:** [backend/Dockerfile](file:///c:/Users/LENOVO/Desktop/project%20for%20git/h/h2/backend/Dockerfile)
* **Optimization Techniques:**
  * **Multi-stage builds:** Separate build-dependencies compilation from execution layers.
  * **Non-root user execution:** Run as `appuser` (UID 10001) for container isolation.
  * **Caching optimization:** Run `pip install` only when `requirements.txt` changes.
  * **Graceful termination:** Forward `SIGTERM` signals directly to the uvicorn workers.

---

## 3. Kubernetes Orchestration

The platform deployments are declared in the Kubernetes manifest file [backend/kubernetes.yaml](file:///c:/Users/LENOVO/Desktop/project%20for%20git/h/h2/backend/kubernetes.yaml).

### 3.1 Key Resource Specifications
* **Namespace:** Isolated under `creditrisk-ai`.
* **Deployments:**
  * `pd-scoring-deployment`: Runs the FastAPI scoring backend. Configured with a `rollingUpdate` deployment strategy.
  * `evidently-monitor-deployment`: Runs the drift monitoring dashboard.
* **Services:** ClusterIP services exposing the deployments internally, mapped via Nginx Ingress Controller to the public DNS records.
* **Autoscaling (HPA):**
  * Target: `pd-scoring-deployment`
  * Scale Limits: Min 3 replicas, Max 10 replicas
  * Target Utilization: CPU > 75% or Memory > 80%
* **Storage (PVC):**
  * PVC Name: `model-pvc` (ReadWriteMany access)
  * Storage Capacity: 50Gi using cloud storage (e.g. AWS EFS, Azure File, GCP Filestore)
  * Mount Path: `/app/models` — allows sharing retrained champion model weights between the CronJob and API deployments.

---

## 4. MLOps Monitoring & Retraining Architecture

### 4.1 Drift Monitoring (Evidently AI / Fiddler)
* **API Ingress logs:** Every request to `/v1/score` logs input features and predicted probabilities to a partitioned Parquet table.
* **Daily Cron Monitor:** An Evidently AI script checks feature-level Population Stability Index (PSI) every 24 hours.
* **Critical Alerts:**
  * If feature-level PSI exceeds `0.10` (Drift Detected), the monitor triggers a Warning.
  * If score migration exceeds **5 bands** for a single borrower (e.g., Moderate → Very High), the alert triggers a critical Slack/PagerDuty notification and flags the account for immediate review.

### 4.2 Retraining Pipeline
* **Trigger Mechanism:** A monthly Kubernetes CronJob (`monthly-retrain-job`) runs on the first day of every month at `00:00 UTC` (`0 0 1 * *`).
* **Champion-Challenger Framework:**
  1. The pipeline trains a challenger model (e.g., LightGBM v1.5) on the newly ingested credit portfolio data.
  2. The challenger model validation metrics are checked against the active champion model (XGBoost v3.2).
  3. If the challenger model achieves an **AUROC improvement $\geq 0.005$** and exhibits stable PSI, it is promoted.
  4. The model binary is written to the shared PVC, and uvicorn triggers an API reload to serve the new model.
