# ══════════════════════════════════════════════════════════════════
#  CreditRisk AI — Dockerfile (Phase 6: FastAPI Model Serving)
#  Multi-stage build for production-grade image
# ══════════════════════════════════════════════════════════════════

# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production image
FROM python:3.11-slim AS production

LABEL maintainer="CreditRisk AI Team"
LABEL version="3.2.0"
LABEL description="PD Scoring API — XGBoost + GNN Ensemble with Alternate Data"

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY backend/ ./

# Copy ML models (mounted via K8s PVC or baked in)
COPY models/ ./models/

# Environment variables
ENV PATH=/root/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    WORKERS=4 \
    LOG_LEVEL=info \
    MODEL_PATH=/app/models/xgboost_v3_2.pkl \
    EVIDENTLY_WORKSPACE=/app/evidently_reports \
    REDIS_URL=redis://redis-service:6379/0 \
    FEATURE_STORE_URL=http://feast-server:6566

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose API port
EXPOSE ${PORT}

# Run with uvicorn + multiple workers
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT --workers $WORKERS --log-level $LOG_LEVEL"]
