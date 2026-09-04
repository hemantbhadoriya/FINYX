import csv
import sqlite3

def read_csv_flexible(file_path):
    records = {}
    with open(file_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Clean header keys (lowercase and remove spaces/quotes)
            clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
            
            # Identify transaction ID column dynamically
            txn_id = clean_row.get('txn_id') or clean_row.get('transaction_id') or clean_row.get('tx_id')
            if txn_id:
                records[txn_id.upper()] = clean_row
    return records

gateway = read_csv_flexible('data/gateway_logs.csv')
bank = read_csv_flexible('data/bank_records.csv')
ledger = read_csv_flexible('data/ledger_data.csv')

records = []
for txn_id, g_row in gateway.items():
    b_row = bank.get(txn_id, {})
    l_row = ledger.get(txn_id, {})

    g_amt = float(g_row.get('amount', 0)) if g_row.get('amount') else 0.0
    b_amt = float(b_row.get('amount', 0)) if b_row.get('amount') else None
    
    g_status = g_row.get('status', '').upper()
    b_status = b_row.get('status', 'NOT_FOUND').upper()
    l_status = l_row.get('status', 'PENDING').upper()

    if b_amt is not None and g_amt != b_amt:
        category = 'AMOUNT_MISMATCH'
    elif g_status == 'SUCCESS' and b_status in ['SETTLED', 'SUCCESS'] and l_status in ['COMPLETED', 'SETTLED']:
        category = 'SETTLED_NORMAL'
    elif g_status == 'SUCCESS' and b_status == 'FAILED':
        category = 'BANK_FAILURE'
    elif g_status == 'SUCCESS' and b_status in ['PROCESSING', 'PENDING']:
        category = 'IN_FLIGHT_PROCESSING'
    elif g_status == 'SUCCESS' and (b_status in ['NOT_FOUND', ''] or not b_row):
        category = 'MISSING_BANK_RECORD'
    else:
        category = 'UNKNOWN'

    records.append((txn_id, g_status, b_status, l_status, g_amt, b_amt or 0.0, category))

# Save output into local SQLite database
conn = sqlite3.connect('reconcile.db')
cursor = conn.cursor()

cursor.execute('DROP TABLE IF EXISTS fct_reconciliation_classified')
cursor.execute('''
    CREATE TABLE fct_reconciliation_classified (
        txn_id TEXT PRIMARY KEY,
        gateway_status TEXT,
        bank_status TEXT,
        ledger_status TEXT,
        gateway_amount REAL,
        bank_amount REAL,
        scenario_category TEXT
    )
''')

cursor.executemany('''
    INSERT INTO fct_reconciliation_classified 
    VALUES (?, ?, ?, ?, ?, ?, ?)
''', records)

conn.commit()
conn.close()

print('? Reconciled successfully!', len(records), 'transactions classified in reconcile.db')
