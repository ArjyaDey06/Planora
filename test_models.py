#!/usr/bin/env python3
"""
Test script to check if models can be loaded properly
"""
import os
import sys
sys.path.append('d:/Planora/backend')

try:
    import joblib
    import pandas as pd
    import numpy as np
    from fastapi import FastAPI
    print("✅ All imports successful")

    # Check if models exist
    models_dir = 'd:/Planora/backend/models'
    if os.path.exists(models_dir):
        print("✅ Models directory exists")

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
                # Try to load the model
                try:
                    loaded_model = joblib.load(model_path)
                    print(f"   Loaded successfully: {type(loaded_model)}")
                except Exception as e:
                    print(f"   ❌ Failed to load: {e}")
            else:
                print(f"❌ {model} missing")
    else:
        print("❌ Models directory not found")

except Exception as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()
