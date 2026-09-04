import duckdb
import pandas as pd

# Connect to DuckDB database built by dbt
con = duckdb.connect("dbt_finyx/reconcile.duckdb")

# Export full reconciliation summary to CSV/Parquet for Power BI ingestion
df = con.execute("SELECT * FROM stg_reconciliation").df()
df.to_csv("finyx_powerbi_dataset.csv", index=False)
df.to_parquet("finyx_powerbi_dataset.parquet", index=False)

con.close()
print("? Power BI dataset exported successfully as finyx_powerbi_dataset.csv!")
