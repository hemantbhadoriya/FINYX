WITH raw_data AS (
    SELECT 
        g.txn_id,
        g.status AS gateway_status,
        COALESCE(b.status, 'MISSING') AS bank_status,
        COALESCE(l.status, 'PENDING') AS ledger_status,
        g.amount AS gateway_amount,
        COALESCE(b.amount, 0) AS bank_amount,
        
        -- Default/Simulated timestamps if not present in raw source
        COALESCE(TRY_CAST(g.expected_settlement AS TIMESTAMP), TIMESTAMP '2026-09-02 10:00:00') AS expected_settlement,
        COALESCE(TRY_CAST(g.current_timestamp AS TIMESTAMP), TIMESTAMP '2026-09-03 15:30:00') AS current_timestamp
    FROM {{ ref('gateway_logs') }} g
    LEFT JOIN {{ ref('bank_records') }} b ON UPPER(TRIM(g.txn_id)) = UPPER(TRIM(b.txn_id))
    LEFT JOIN {{ ref('ledger_data') }} l ON UPPER(TRIM(g.txn_id)) = UPPER(TRIM(l.txn_id))
)
SELECT 
    txn_id,
    gateway_status,
    bank_status,
    ledger_status,
    gateway_amount,
    bank_amount,
    
    -- SLA Metrics
    expected_settlement,
    current_timestamp,
    ROUND(EPOCH(current_timestamp - expected_settlement) / 3600.0, 1) AS expected_window_exceeded_hours,

    -- Dynamic Discrepancy Point Location
    CASE 
        WHEN gateway_status IN ('FAILED', 'PENDING') THEN 'USER_TO_GATEWAY'
        WHEN gateway_status = 'SUCCESS' AND bank_status IN ('MISSING', 'FAILED', 'PENDING') THEN 'GATEWAY_TO_BANK'
        ELSE 'NONE'
    END AS crash_location,

    -- Advanced Classification
    CASE 
        WHEN gateway_status = 'SUCCESS' AND bank_status = 'MISSING' 
             AND (EPOCH(current_timestamp - expected_settlement) / 3600.0) > 0 THEN 'OVERDUE_SETTLEMENT'
        WHEN gateway_amount != bank_amount AND bank_amount > 0 THEN 'AMOUNT_MISMATCH'
        WHEN gateway_status = 'SUCCESS' AND bank_status = 'SUCCESS' THEN 'SETTLED'
        ELSE 'UNCLASSIFIED'
    END AS scenario_category,

    -- Default Metrics
    'MEDIUM' AS confidence,
    'NOT ESTABLISHED' AS root_cause
FROM raw_data
