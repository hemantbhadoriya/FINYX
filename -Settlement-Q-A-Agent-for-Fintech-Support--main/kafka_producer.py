import json
import time
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

events = [
    {"txn_id": "TXN_9001", "amount": 2500.00, "status": "SUCCESS"},
    {"txn_id": "TXN_9002", "amount": 1200.50, "status": "FAILED"},
    {"txn_id": "TXN_9003", "amount": 5000.00, "status": "SUCCESS"}
]

for event in events:
    producer.send('gateway-logs-topic', value=event)
    print(f"Sent: {event}")
    time.sleep(1)

producer.flush()
print("? Kafka messages published successfully!")
