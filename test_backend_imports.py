#!/usr/bin/env python3
"""Test backend imports and startup"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

print("Testing Python imports...")
try:
    import fastapi
    print("✅ FastAPI imported successfully")
except ImportError as e:
    print(f"❌ FastAPI import failed: {e}")

try:
    import uvicorn
    print("✅ Uvicorn imported successfully")
except ImportError as e:
    print(f"❌ Uvicorn import failed: {e}")

try:
    import pandas as pd
    print("✅ Pandas imported successfully")
except ImportError as e:
    print(f"❌ Pandas import failed: {e}")

try:
    import joblib
    print("✅ Joblib imported successfully")
except ImportError as e:
    print(f"❌ Joblib import failed: {e}")

try:
    import numpy as np
    print("✅ NumPy imported successfully")
except ImportError as e:
    print(f"❌ NumPy import failed: {e}")

try:
    from sklearn.ensemble import RandomForestClassifier
    print("✅ Scikit-learn imported successfully")
except ImportError as e:
    print(f"❌ Scikit-learn import failed: {e}")

try:
    import xgboost as xgb
    print("✅ XGBoost imported successfully")
except ImportError as e:
    print(f"❌ XGBoost import failed: {e}")

print("\nTesting backend app import...")
try:
    from backend.app import app
    print("✅ Backend app imported successfully")
    print(f"App title: {app.title}")
except Exception as e:
    print(f"❌ Backend app import failed: {e}")
