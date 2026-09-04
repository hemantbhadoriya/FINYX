WITH gateway AS (
    SELECT * FROM {{ ref('gateway_logs') }}
),
bank AS (
    SELECT * FROM {{ ref('bank_records') }}
),
ledger AS (
    SELECT * FROM {{ ref('ledger_data') }}
)
SELECT 
    g.txn_id,
    g.status AS gateway_status,
    COALESCE(b.status, 'NOT_FOUND') AS bank_status,
    COALESCE(l.status, 'PENDING') AS ledger_status,
    CAST(g.amount AS FLOAT) AS gateway_amount,
    CAST(COALESCE(b.amount, 0) AS FLOAT) AS bank_amount,
    CASE 
        WHEN COALESCE(b.amount, 0) != 0 AND g.amount != b.amount THEN 'AMOUNT_MISMATCH'
        WHEN g.status = 'SUCCESS' AND b.status IN ('SETTLED', 'SUCCESS') AND l.status IN ('COMPLETED', 'SETTLED') THEN 'SETTLED_NORMAL'
        WHEN g.status = 'SUCCESS' AND b.status = 'FAILED' THEN 'BANK_FAILURE'
        WHEN g.status = 'SUCCESS' AND b.status IN ('PROCESSING', 'PENDING') THEN 'IN_FLIGHT_PROCESSING'
        WHEN g.status = 'SUCCESS' AND (b.status IS NULL OR b.status = 'NOT_FOUND') THEN 'MISSING_BANK_RECORD'
        ELSE 'UNKNOWN'
    END AS scenario_category
FROM gateway g
LEFT JOIN bank b ON UPPER(g.txn_id) = UPPER(b.txn_id)
LEFT JOIN ledger l ON UPPER(g.txn_id) = UPPER(l.txn_id)
