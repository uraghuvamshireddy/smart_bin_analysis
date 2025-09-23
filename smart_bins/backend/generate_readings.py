import random
import time
import requests
from datetime import datetime

API_URL = "http://127.0.0.1:8000/readings/" 

bin_ids = ["BIN001", "BIN002", "BIN003", "BIN004", "BIN005"]

while True:
    for bin_id in bin_ids:
        data = {
            "bin_id": bin_id,
            "fill_pct": random.randint(0, 100),
            "ts": datetime.now().isoformat()
        }
        try:
            response = requests.post(API_URL, json=data)
            if response.status_code == 200:
                print(f"Sent reading for {bin_id}: {data['fill_pct']}%")
            else:
                print(f"Failed for {bin_id}: {response.text}")
        except Exception as e:
            print(f"Error sending data for {bin_id}: {e}")

    time.sleep(5)  
