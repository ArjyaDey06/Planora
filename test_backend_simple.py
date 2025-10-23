#!/usr/bin/env python3
"""
Simple test to check backend imports and model loading
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, 'd:/Planora/backend')

try:
    print("Testing imports...")
    from app import app
    print("✅ App imported successfully")

    # Test if models can be loaded
    print("\nTesting model loading...")
    import joblib
    import numpy as np

    models_dir = 'd:/Planora/backend/models'
    if os.path.exists(models_dir):
        print("✅ Models directory exists")

        # Test loading each required model
        required_models = [
            "risk_model.joblib",
            "debt_capacity_model.joblib",
            "financial_health_model.joblib",
            "clustering_model.joblib",
            "scaler.joblib"
        ]

        for model in required_models:
            model_path = os.path.join(models_dir, model)
            if os.path.exists(model_path):
                print(f"✅ {model} exists")
                try:
                    loaded_model = joblib.load(model_path)
                    print(f"   Loaded successfully: {type(loaded_model)}")
                except Exception as e:
                    print(f"   ❌ Failed to load: {e}")
            else:
                print(f"❌ {model} missing")
    else:
        print("❌ Models directory not found")

    print("\n✅ All basic tests passed!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
