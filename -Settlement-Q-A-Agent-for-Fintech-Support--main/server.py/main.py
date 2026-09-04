from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="FINyX Reconciliation Engine")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input Schema
class TransactionRequest(BaseModel):
    txn_id: str
    gateway_status: Optional[str] = "SUCCESS"
    bank_status: Optional[str] = None
    ledger_status: Optional[str] = None
    gateway_amount: Optional[float] = 2500.0
    bank_amount: Optional[float] = 2500.0

# Mock Database / Registry for the 5 Scenarios
MOCK_DATABASE = {
    "TXN_1001": {
        "gateway_status": "SUCCESS",
        "bank_status": "SETTLED",
        "ledger_status": "COMPLETED",
        "gateway_amount": 2500.0,
        "bank_amount": 2500.0
    },
    "TXN_1002": {
        "gateway_status": "SUCCESS",
        "bank_status": "FAILED",
        "ledger_status": "PENDING",
        "gateway_amount": 4500.0,
        "bank_amount": 4500.0
    },
    "TXN_1003": {
        "gateway_status": "SUCCESS",
        "bank_status": "PROCESSING",
        "ledger_status": "PENDING",
        "gateway_amount": 25000.0,
        "bank_amount": 25000.0
    },
    "TXN_1004": {
        "gateway_status": "SUCCESS",
        "bank_status": "NOT_FOUND",
        "ledger_status": "PENDING",
        "gateway_amount": 8200.0,
        "bank_amount": 8200.0
    },
    "TXN_1005": {
        "gateway_status": "SUCCESS",
        "bank_status": "SETTLED",
        "ledger_status": "PENDING",
        "gateway_amount": 2500.0,
        "bank_amount": 2400.0
    }
}

@app.post("/api/trace")
def classify_transaction(req: TransactionRequest):
    txn_id = req.txn_id.upper()
    
    # Retrieve mock data or use request parameters
    record = MOCK_DATABASE.get(txn_id, {
        "gateway_status": req.gateway_status,
        "bank_status": req.bank_status or "SETTLED",
        "ledger_status": req.ledger_status or "COMPLETED",
        "gateway_amount": req.gateway_amount,
        "bank_amount": req.bank_amount
    })

    g_status = record["gateway_status"]
    b_status = record["bank_status"]
    l_status = record["ledger_status"]
    g_amt = record["gateway_amount"]
    b_amt = record["bank_amount"]

    # SCENARIO 5 — Amount Mismatch (High Priority Rule)
    if g_amt != b_amt:
        return {
            "issueType": "AMOUNT_MISMATCH",
            "healthScore": 15,
            "healthLabel": "Critical Mismatch",
            "confidenceScore": 99,
            "rootCause": f"Settlement discrepancy: Gateway (₹{g_amt}) vs Bank (₹{b_amt})",
            "exceptions": [f"Amount Mismatch Detected: ₹{g_amt} != ₹{b_amt}", "Ledger Reconciliation Blocked"],
            "title": "Settlement Amount Mismatch Detected",
            "note": f"Gateway processed ₹{g_amt}, but bank recorded settlement of ₹{b_amt}.",
            "aiExplanation": "A discrepancy was detected between what was charged by the payment gateway and what was credited by the bank. The account ledger has been temporarily frozen for safety.",
            "action": "Flagged for manual reconciliation audit and freeze."
        }

    # SCENARIO 1 — Everything is normal
    if g_status == "SUCCESS" and b_status == "SETTLED" and l_status == "COMPLETED":
        return {
            "issueType": "SUCCESS",
            "healthScore": 98,
            "healthLabel": "Optimal Health",
            "confidenceScore": 99,
            "rootCause": "None (All Systems Operational)",
            "exceptions": ["No System Exceptions Detected"],
            "title": "Settlement Completed Successfully",
            "note": "Transaction successfully verified across Gateway, Bank Switch, and Core Ledger.",
            "aiExplanation": "Settlement completed successfully! All system rails confirmed receipt without any drops or holds.",
            "action": "UTR generated and updated in banking records."
        }

    # SCENARIO 2 — Bank failure
    if g_status == "SUCCESS" and b_status == "FAILED" and l_status == "PENDING":
        return {
            "issueType": "BANK_FAILURE",
            "healthScore": 30,
            "healthLabel": "Stage Failure",
            "confidenceScore": 95,
            "rootCause": "Bank Stage Processing Failure",
            "exceptions": ["Bank Switch Reject Code 501", "Core Banking Response Timeout"],
            "title": "Bank Settlement Failed",
            "note": "Payment was successful, but settlement failed at the bank stage due to the recorded failure reason.",
            "aiExplanation": "Your payment passed through the gateway switch, but your bank rejected the deposit into the ledger due to a technical error.",
            "action": "Auto-reversal scheduled under RBI settlement rules."
        }

    # SCENARIO 3 — Still processing
    if g_status == "SUCCESS" and b_status == "PROCESSING" and l_status == "PENDING":
        return {
            "issueType": "PROCESSING",
            "healthScore": 65,
            "healthLabel": "In-Flight Delay",
            "confidenceScore": 88,
            "rootCause": "Batch Clearing Queue Delay",
            "exceptions": ["T+1 Settlement Window Active", "Queue Response Pending"],
            "title": "Settlement Still Processing",
            "note": "Settlement is still being processed. No specific failure reason is available in the records.",
            "aiExplanation": "Your payment is currently sitting in the bank's processing queue. There are no technical errors logged, so it will likely clear automatically.",
            "action": "Monitored under RBI T+1 SLA guidelines. Auto-polling every 15 mins."
        }

    # SCENARIO 4 — Missing bank record
    if g_status == "SUCCESS" and b_status == "NOT_FOUND" and l_status == "PENDING":
        return {
            "issueType": "MISSING_RECORD",
            "healthScore": 45,
            "healthLabel": "Unverified Record",
            "confidenceScore": 91,
            "rootCause": "Missing Destination Bank Entry",
            "exceptions": ["Bank Switch Log Missing", "Insufficient Transaction Metadata"],
            "title": "Missing Bank Settlement Record",
            "note": "Payment was successful, but no corresponding bank settlement record was found. The available data is insufficient to determine the cause.",
            "aiExplanation": "The payment gateway confirms money was sent, but the bank's database has no record of receiving it yet. Further switch log analysis is needed.",
            "action": "Manual audit request dispatched to bank nodal officer."
        }

    # Fallback Unhandled Case
    return {
        "issueType": "UNKNOWN",
        "healthScore": 50,
        "healthLabel": "Unmapped State",
        "confidenceScore": 70,
        "rootCause": "Non-standard transaction state",
        "exceptions": ["Unrecognized Input Vector"],
        "title": "Manual Audit Required",
        "note": "State combination does not match standard reconciliation rules.",
        "aiExplanation": "This transaction exhibits unusual behavior that requires a manual review by financial operators.",
        "action": "Escalated to Tier 2 support."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)