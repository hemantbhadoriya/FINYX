import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Training Dataset mapped to the 5 Reconciliation Scenarios
data = [
    ['SUCCESS', 'SETTLED', 'COMPLETED', 2500, 2500, 'SETTLED_NORMAL'],
    ['SUCCESS', 'FAILED', 'PENDING', 4500, 4500, 'BANK_FAILURE'],
    ['SUCCESS', 'PROCESSING', 'PENDING', 25000, 25000, 'IN_FLIGHT_PROCESSING'],
    ['SUCCESS', 'NOT_FOUND', 'PENDING', 8200, 8200, 'MISSING_BANK_RECORD'],
    ['SUCCESS', 'SETTLED', 'PENDING', 2500, 2400, 'AMOUNT_MISMATCH'],
    ['SUCCESS', 'SETTLED', 'COMPLETED', 1000, 1000, 'SETTLED_NORMAL'],
    ['SUCCESS', 'FAILED', 'PENDING', 1200, 1200, 'BANK_FAILURE'],
    ['SUCCESS', 'PROCESSING', 'PENDING', 3000, 3000, 'IN_FLIGHT_PROCESSING'],
    ['SUCCESS', 'NOT_FOUND', 'PENDING', 5000, 5000, 'MISSING_BANK_RECORD'],
    ['SUCCESS', 'SETTLED', 'PENDING', 5000, 4800, 'AMOUNT_MISMATCH']
]

df = pd.DataFrame(data, columns=['g_status', 'b_status', 'l_status', 'g_amt', 'b_amt', 'label'])

# Encode categorical text values into numeric inputs
encoders = {}
for col in ['g_status', 'b_status', 'l_status']:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

X = df[['g_status', 'b_status', 'l_status', 'g_amt', 'b_amt']]
y = df['label']

# Train Random Forest ML Classifier
clf = RandomForestClassifier(n_estimators=10, random_state=42)
clf.fit(X, y)

# Save trained artifacts
joblib.dump(clf, 'model.pkl')
joblib.dump(encoders, 'encoders.pkl')
print("✅ Machine Learning model trained and saved successfully as model.pkl!")