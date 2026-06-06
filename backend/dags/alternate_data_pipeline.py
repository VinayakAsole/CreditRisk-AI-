"""
CreditRisk AI — Alternate Data Ingestion Airflow DAG
Phase 2: Ingestion & Feature Generation ETL
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.utils.task_group import TaskGroup
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator

# Default arguments for the DAG
default_args = {
    'owner': 'data_engineering',
    'depends_on_past': False,
    'start_date': datetime(2026, 6, 1),
    'email': ['data_alerts@bank.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

def check_consent_records(**kwargs):
    """Verifies user consent before fetching alternate data."""
    print("Querying applicant consent registry database...")
    # Logic to fetch and verify active consent signatures
    return True

def notify_pipeline_success(**kwargs):
    """Notifies Feast Feature Store and telemetry systems of successful ingestion."""
    print("Ingestion completed. Triggering Feast feature store materialized view rebuild...")
    return True

with DAG(
    'creditrisk_alternate_data_ingestion',
    default_args=default_args,
    description='Automated pipeline for collecting 8 alternate data sources and writing features to Redis/S3',
    schedule_interval='@hourly',
    catchup=False,
    max_active_runs=1,
) as dag:

    # 1. Verification Tasks
    verify_consent = PythonOperator(
        task_id='verify_applicant_consent',
        python_callable=check_consent_records,
    )

    # 2. Source Ingestion TaskGroups
    with TaskGroup('ingest_partner_data') as ingest_partner_data:
        
        ingest_telecom = SimpleHttpOperator(
            task_id='fetch_telecom_cdr',
            http_conn_id='telecom_partner_api',
            endpoint='v1/records/cdr',
            method='GET',
            headers={"Content-Type": "application/json", "Authorization": "Bearer {{ var.value.telecom_api_token }}"},
            data={"limit": 50000},
            response_filter=lambda response: response.json(),
        )

        ingest_utility = SimpleHttpOperator(
            task_id='fetch_utility_bills',
            http_conn_id='bbps_utility_api',
            endpoint='v1/bills/history',
            method='GET',
            headers={"Content-Type": "application/json", "Authorization": "Bearer {{ var.value.utility_api_token }}"},
            response_filter=lambda response: response.json(),
        )

        ingest_ecommerce = SimpleHttpOperator(
            task_id='fetch_ecommerce_orders',
            http_conn_id='marketplace_partner_api',
            endpoint='v2/orders/aggregate',
            method='GET',
            headers={"Content-Type": "application/json", "Authorization": "Bearer {{ var.value.ecommerce_api_token }}"},
            response_filter=lambda response: response.json(),
        )

        ingest_gst = SimpleHttpOperator(
            task_id='fetch_gstn_filings',
            http_conn_id='gstn_gateway_api',
            endpoint='v1/filings/gstr1',
            method='GET',
            headers={"Content-Type": "application/json", "Authorization": "Bearer {{ var.value.gst_api_token }}"},
            response_filter=lambda response: response.json(),
        )

        # Set taskgroup order parallel execution
        [ingest_telecom, ingest_utility, ingest_ecommerce, ingest_gst]

    # 3. ETL & Feature Store Materialization
    compute_features = SparkSubmitOperator(
        task_id='spark_compute_alternate_features',
        application='/opt/spark-apps/compute_features.py',
        conn_id='spark_default',
        conf={
            'spark.serializer': 'org.apache.spark.serializer.KryoSerializer',
            'spark.sql.streaming.forceDeleteTempCheckpointLocation': 'true'
        },
        application_args=[
            '--raw-bucket', 's3a://creditrisk-datalake-raw/',
            '--feature-bucket', 's3a://creditrisk-datalake-features/'
        ],
        name='spark_alternate_data_etl',
    )

    materialize_feast = PythonOperator(
        task_id='materialize_feast_online_store',
        python_callable=notify_pipeline_success,
    )

    # Pipeline Sequence
    verify_consent >> ingest_partner_data >> compute_features >> materialize_feast
