#!/usr/bin/env python3
"""
Test both simple and debt analysis endpoints
"""
import urllib.request
import urllib.error
import json

def test_simple_endpoint():
    """Test the simple endpoint"""
    try:
        print("Testing simple endpoint...")
        with urllib.request.urlopen('http://localhost:8000/test-simple', timeout=5) as response:
            data = json.loads(response.read().decode())
            print(f"✅ Simple endpoint successful: {json.dumps(data, indent=2)}")
            return True
    except Exception as e:
        print(f"❌ Simple endpoint failed: {e}")
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
    print("Testing FastAPI endpoints...")
    print("=" * 40)

    simple_ok = test_simple_endpoint()
    analysis_ok = test_debt_analysis()

    if simple_ok and analysis_ok:
        print("\n🎉 All tests passed!")
    elif simple_ok:
        print("\n⚠️ Simple endpoint works, but debt analysis still fails")
    else:
        print("\n❌ Both endpoints failed")
