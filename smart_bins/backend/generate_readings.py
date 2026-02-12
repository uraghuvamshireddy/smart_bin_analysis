import requests
import time
import random

BASE_URL = "http://127.0.0.1:8000"
BINS_ENDPOINT = f"{BASE_URL}/bins/"
READINGS_ENDPOINT = f"{BASE_URL}/readings/"

SLEEP_BETWEEN_CYCLES = 5 
def fetch_bins():
    try:
        r = requests.get(BINS_ENDPOINT, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Error fetching bins:", e)
        return []

def send_reading(bin_id, fill_pct):
    payload = {
        "bin_id": bin_id,
        "fill_pct": int(fill_pct)
    }
    try:
        r = requests.post(READINGS_ENDPOINT, json=payload, timeout=5)
        if r.status_code == 200 or r.status_code == 201:
            return True
        else:
            print("Bad response while posting reading:", r.status_code, r.text)
            return False
    except Exception as e:
        print("Error posting reading:", e)
        return False

def simulate_once():
    bins = fetch_bins()
    if not bins:
        print("No bins found, sleeping...")
        time.sleep(SLEEP_BETWEEN_CYCLES)
        return

    for b in bins:
        bin_id = b.get("bin_id") or b.get("bin_id") 
        
        current = b.get("current_fill_pct", 0)

        if current is None:
            current = 0


        if current >= 100:
            new_val =100
            reason = "increased by 0"
        else:
            step = random.choices([0,1,2,3,4,5,6,7], weights=[5,20,15,15,15,10,10,10])[0]
            new_val = current + step
            if new_val > 100:
                new_val = 100
            reason = f"increased by {step}"

        print(f"Bin {bin_id}: {current}% -> {new_val}% ({reason})")
        success = send_reading(bin_id, new_val)
        if not success:
            print("Failed to send reading for", bin_id)

    time.sleep(SLEEP_BETWEEN_CYCLES)

if __name__ == "__main__":
    print("Starting dummy simulator. Press Ctrl+C to stop.")
    while True:
        simulate_once()
