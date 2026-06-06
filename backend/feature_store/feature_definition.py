"""
CreditRisk AI — Feast Feature Definitions Schema
Phase 2: Feature Store Setup
"""
from datetime import timedelta
from feast import (
    Entity,
    Field,
    FeatureView,
    FileSource,
)
from feast.types import Float32, Int64, String

# 1. Define Entity
applicant = Entity(
    name="applicant_id",
    value_type=Entity.ValueType.STRING,
    description="Unique identifier of the credit applicant",
)

# 2. Define Data Sources (Parquet files materialized by Apache Spark)
telecom_source = FileSource(
    path="s3a://creditrisk-datalake-features/telecom_features.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_field="created_timestamp",
)

utility_source = FileSource(
    path="s3a://creditrisk-datalake-features/utility_features.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_field="created_timestamp",
)

ecommerce_source = FileSource(
    path="s3a://creditrisk-datalake-features/ecommerce_features.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_field="created_timestamp",
)

gst_source = FileSource(
    path="s3a://creditrisk-datalake-features/gst_features.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_field="created_timestamp",
)

# 3. Define Feature Views
telecom_feature_view = FeatureView(
    name="telecom_features",
    entities=[applicant],
    ttl=timedelta(days=90),
    schema=[
        Field(name="telecom_recharge_regularity_score", dtype=Float32),
        Field(name="telecom_avg_topup_amount_30d", dtype=Float32),
        Field(name="telecom_sim_swap_count_180d", dtype=Int64),
        Field(name="telecom_roaming_index", dtype=Float32),
    ],
    online=True,
    source=telecom_source,
)

utility_feature_view = FeatureView(
    name="utility_features",
    entities=[applicant],
    ttl=timedelta(days=120),
    schema=[
        Field(name="utility_max_dpd_12m", dtype=Int64),
        Field(name="utility_bill_paid_on_time_ratio", dtype=Float32),
        Field(name="utility_monthly_avg_bill_amount", dtype=Float32),
    ],
    online=True,
    source=utility_source,
)

ecommerce_feature_view = FeatureView(
    name="ecommerce_features",
    entities=[applicant],
    ttl=timedelta(days=60),
    schema=[
        Field(name="ecommerce_monthly_spend_ratio", dtype=Float32),
        Field(name="ecommerce_order_cancellation_rate", dtype=Float32),
        Field(name="ecommerce_emi_purchase_count_90d", dtype=Int64),
        Field(name="ecommerce_lifestyle_luxury_spend_index", dtype=Float32),
    ],
    online=True,
    source=ecommerce_source,
)

gst_feature_view = FeatureView(
    name="gst_features",
    entities=[applicant],
    ttl=timedelta(days=365),
    schema=[
        Field(name="gst_sales_volatility_coefficient", dtype=Float32),
        Field(name="gst_filing_delay_days_avg", dtype=Float32),
        Field(name="gst_tax_compliance_status", dtype=String),
    ],
    online=True,
    source=gst_source,
)
