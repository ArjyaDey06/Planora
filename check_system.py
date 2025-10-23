#!/usr/bin/env python3
"""
System Status Checker for Planora AI Financial Advisor
This script checks if all components are running correctly.
"""

import requests
import sys
from datetime import datetime

def check_backend():
    """Check if backend is running and healthy"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend Status: HEALTHY")
            print(f"   - Models loaded: {data.get('models_loaded', 0)}")
            print(f"   - Dataset loaded: {data.get('dataset_loaded', False)}")
            print(f"   - Last check: {data.get('timestamp', 'Unknown')}")
            return True
        else:
            print(f"❌ Backend Status: ERROR (HTTP {response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend Status: NOT RUNNING (Connection refused)")
        return False
    except Exception as e:
        print(f"❌ Backend Status: ERROR ({e})")
        return False

def check_frontend():
    """Check if frontend is running"""
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend Status: RUNNING")
            print("   - Available at: http://localhost:5173")
            return True
        else:
            print(f"❌ Frontend Status: ERROR (HTTP {response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend Status: NOT RUNNING (Connection refused)")
        return False
    except Exception as e:
        print(f"❌ Frontend Status: ERROR ({e})")
        return False

def test_api():
    """Test the debt analysis API"""
    try:
        test_data = {
            "monthly_income": 50000,
            "expenses": 30000,
            "savings": 15000,
            "emergency_fund": 150000,
            "debt_amount": 500000,
            "monthly_emi": 8000,
            "age": 30,
            "occupation": "Salaried",
            "has_loans": True
        }
        
        response = requests.post(
            "http://localhost:8000/analyze-debt",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Test: SUCCESS")
            print(f"   - Risk Category: {data.get('risk_category', 'Unknown')}")
            print(f"   - Financial Health: {data.get('financial_health', 'Unknown')}")
            print(f"   - Confidence Score: {data.get('confidence_score', 0):.2f}")
            return True
        else:
            print(f"❌ API Test: FAILED (HTTP {response.status_code})")
            print(f"   - Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ API Test: ERROR ({e})")
        return False

def main():
    """Main system check function"""
    print("🔍 Planora System Status Check")
    print("=" * 40)
    print(f"⏰ Check Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check components
    backend_ok = check_backend()
    print()
    frontend_ok = check_frontend()
    print()
    
    # Test API if backend is running
    api_ok = False
    if backend_ok:
        api_ok = test_api()
        print()
    
    # Summary
    print("📋 SYSTEM SUMMARY")
    print("-" * 20)
    
    if backend_ok and frontend_ok and api_ok:
        print("🎉 ALL SYSTEMS OPERATIONAL!")
        print()
        print("🌐 Access your application:")
        print("   • Frontend: http://localhost:5173")
        print("   • Backend API: http://localhost:8000")
        print("   • API Docs: http://localhost:8000/docs")
        print()
        print("✨ Ready to analyze debt profiles!")
        return True
    else:
        print("⚠️  ISSUES DETECTED:")
        if not backend_ok:
            print("   - Backend not running (start with: python start_backend.py)")
        if not frontend_ok:
            print("   - Frontend not running (start with: npm run dev)")
        if backend_ok and not api_ok:
            print("   - API not responding correctly")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
