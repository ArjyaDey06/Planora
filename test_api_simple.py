#!/usr/bin/env python3
"""
Simple API test using urllib instead of requests
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
    except urllib.error.URLError as e:
        print(f"❌ Health check failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_debt_analysis():
    """Test the debt analysis endpoint"""
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

    except urllib.error.URLError as e:
        print(f"❌ Debt analysis failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Planora Backend API...")
    print("=" * 40)

    health_ok = test_health()
    if health_ok:
        analysis_ok = test_debt_analysis()
        if analysis_ok:
            print("\n🎉 All tests passed! Backend API is working correctly.")
            sys.exit(0)
        else:
            print("\n❌ Debt analysis test failed.")
            sys.exit(1)
    else:
        print("\n❌ Health check failed.")
        sys.exit(1)
