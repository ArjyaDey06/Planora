#!/usr/bin/env python3
"""
Test script to check if the backend API is working
"""
import requests
import json

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get('http://localhost:8001/health', timeout=5)
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"Error testing health endpoint: {e}")
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
        response = requests.post('http://localhost:8001/analyze-debt',
                               json=test_data, timeout=10)
        print(f"Debt analysis status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"Error testing debt analysis: {e}")
        return False

if __name__ == "__main__":
    print("Testing Planora Backend API...")
    print("=" * 40)

    print("\n1. Testing health endpoint...")
    health_ok = test_health()

    if health_ok:
        print("\n2. Testing debt analysis endpoint...")
        analysis_ok = test_debt_analysis()

        if analysis_ok:
            print("\n✅ All tests passed! Backend API is working correctly.")
        else:
            print("\n❌ Debt analysis test failed.")
    else:
        print("\n❌ Health check failed. Backend may not be running properly.")
