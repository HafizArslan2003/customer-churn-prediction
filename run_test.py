import requests

with open("test_bulk_10.csv", "rb") as f:
    files = {"file": f}
    r = requests.post("http://127.0.0.1:8000/predict/bulk", files=files)
    print(r.status_code)
    data = r.json()
    print(f"Total: {data[\"total\"]}, High Risk: {data[\"high_risk\"]}")
    for row in data["results"]:
        print(f"{row[\"name\"]:^20} | {row.get(\"risk_level\", \"err\"):^8} | email: {row.get(\"email_status\", \"-\")}")

