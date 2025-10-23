#!/usr/bin/env python3
"""
Detailed API test with better error handling
"""
import urllib.request
import urllib.error
import json
import sys

def test_health():
    """Test the health endpoint"""
    try:
        print("Testing health endpoint...")
        with urllib.request.urlopen('http://localhost:8000/health', timeout=5) as response:
            data = json.loads(response.read().decode())
            print(f"✅ Health check successful: {json.dumps(data, indent=2)}")
            return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_debt_analysis():
    """Test the debt analysis endpoint with detailed error reporting"""
    test_data = {
        "monthly_income": 100000,
        "expenses": 60000,
        "savings": 20000,
        "emergency_fund": 300000,
        "debt_amount": 500000,
        "monthly_emi": 15000,
        "age": 35,
        "occupation": "Salaried",
        "has_loans": True
    }

    try:
        print("\nTesting debt analysis endpoint...")
        data = json.dumps(test_data).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/analyze-debt',
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode())
            print(f"✅ Debt analysis successful: {json.dumps(result, indent=2)}")
            return True

    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        try:
            error_data = json.loads(e.read().decode())
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error response: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌ Other error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Planora Backend API...")
    print("=" * 40)

    health_ok = test_health()
    if health_ok:
        analysis_ok = test_debt_analysis()
    else:
        print("Skipping debt analysis test due to health check failure")
