# 📘 CreditRisk AI — MLOps Deployment & Operations Runbook
**Version:** 1.0.0  
**Phase:** Phase 6 — Deployment & Monitoring  
**Target Audience:** DevOps Engineers, MLOps Engineers, Risk Operations  

---

## 1. Containerization & Build Pipeline

The FastAPI PD scoring engine is packaged as a Docker container.

### 1.1 Local Build and Test
To build and run the Docker container locally for validation:
```bash
# Build the image using the Phase 6 Dockerfile
docker build -t creditrisk-api:v3.2.0 -f backend/Dockerfile backend/

# Run the container mapping port 8000
docker run -d -p 8000:8000 --name creditrisk-serving creditrisk-api:v3.2.0
```

### 1.2 Registry Push
Tag and push the validated serving image to the organization's Container Registry (e.g., AWS ECR, Azure ACR):
```bash
docker tag creditrisk-api:v3.2.0 <registry-url>/creditrisk/api:v3.2.0
docker push <registry-url>/creditrisk/api:v3.2.0
```

---

## 2. Kubernetes Cluster Deployment

Deployments are managed via the Kubernetes manifest: [backend/kubernetes.yaml](file:///c:/Users/LENOVO/Desktop/project%20for%20git/h/h2/backend/kubernetes.yaml).

### 2.1 First-Time Setup
1. Create the dedicated isolated namespace:
   ```bash
   kubectl create namespace creditrisk-ai
   ```
2. Configure credentials and registry secrets:
   ```bash
   kubectl create secret docker-registry registry-credentials \
     --docker-server=<registry-url> \
     --docker-username=<username> \
     --docker-password=<password> \
     --namespace=creditrisk-ai
   ```
3. Apply the deployment manifest:
   ```bash
   kubectl apply -f backend/kubernetes.yaml
   ```

### 2.2 Operational Verification
* **Check running pods:** `kubectl get pods -n creditrisk-ai`
* **Check horizontal pod autoscaler (HPA):** `kubectl get hpa -n creditrisk-ai`
* **Check PVC status:** `kubectl get pvc -n creditrisk-ai`

---

## 3. Alerts Response SOP (Standard Operating Procedure)

The platform generates two types of automated operational alerts:

### 3.1 Alert A: Feature Drift Warning (`PSI > 0.10`)
* **Trigger:** Monthly or daily drift audits calculate Population Stability Index (PSI) exceeding 0.10 for key alternate features.
* **SOP Protocol:**
  1. Inspect feature-level drift report via `GET /v1/monitoring/psi` or the Model Observatory tab.
  2. Identify the drifting feature (e.g., e-commerce spend).
  3. If PSI is between `0.10` and `0.20`, schedule a manual retraining job.
  4. If PSI exceeds `0.20`, trigger immediate retraining via the API:
     ```bash
     curl -X POST http://localhost:8000/v1/retrain -H "Content-Type: application/json" -d '{"trigger": "drift_triggered", "model_type": "ensemble"}'
     ```

### 3.2 Alert B: Critical Score Migration (`Migration > 5 Bands`)
* **Trigger:** An active borrower's calibrated PD migrates upwards by more than 5 risk bands (e.g., Low $\rightarrow$ Very High) within a 30-day window.
* **SOP Protocol:**
  1. The platform raises a Critical PagerDuty alert. Collection teams must stop all auto-limit extensions.
  2. Underwriters must query `/v1/monitoring/score-migration` to extract the borrower profile (e.g., Amit Verma, Alert `SMA-001`).
  3. Risk analysts must review the SHAP explainability waterfall to isolate the cause (e.g., sudden utility defaults).
  4. Escalate to the legal collection department within 4 hours.

---

## 4. Retraining Pipeline & Model Promotion

### 4.1 Automated Retraining Cycle
The model retraining runs automatically on the 1st of every month at `00:00 UTC` via a Kubernetes CronJob.
* **Logs Inspection:**
  ```bash
  # List recent retraining job completions
  kubectl get jobs -n creditrisk-ai
  
  # Fetch logs of the retraining pod
  kubectl logs -f job/monthly-retrain-job -n creditrisk-ai
  ```

### 4.2 Manual Model Swap / Challenger Promotion
To manually promote the challenger model to production (when its validation metrics exceed the champion's):
1. Send a promotion POST request to the configuration endpoint:
   ```bash
   curl -X POST http://localhost:8000/v1/alerts/score-migration?threshold_bands=5
   ```
2. The endpoint validates and marks the challenger binary in the shared PVC `/app/models/` as the new champion.
3. Perform a rolling restart of the API deployment:
   ```bash
   kubectl rollout restart deployment/pd-scoring-deployment -n creditrisk-ai
   ```
