#!/usr/bin/env python3
"""
Test to isolate where the debt analysis error occurs
"""
import sys
import os
import numpy as np
import joblib

# Add backend directory to path
sys.path.insert(0, 'd:/Planora/backend')

def test_model_loading():
    """Test loading individual models"""
    models_dir = 'd:/Planora/backend/models'
    required_models = [
        "risk_model.joblib",
        "debt_capacity_model.joblib",
        "financial_health_model.joblib",
        "clustering_model.joblib",
        "scaler.joblib"
    ]

    models = {}
    scaler = None

    for model in required_models:
        model_path = os.path.join(models_dir, model)
        if os.path.exists(model_path):
            print(f"Loading {model}...")
            try:
                if model == "scaler.joblib":
                    scaler = joblib.load(model_path)
                    print(f"✅ Scaler loaded: {type(scaler)}")
                else:
                    loaded_model = joblib.load(model_path)
                    models[model.replace('.joblib', '')] = loaded_model
                    print(f"✅ Model loaded: {type(loaded_model)}")
            except Exception as e:
                print(f"❌ Failed to load {model}: {e}")
                return None, None

    return models, scaler

def test_feature_preparation():
    """Test the exact feature preparation from the API"""
    # Test data similar to what's sent from frontend
    request_data = {
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

    print("Preparing features...")

    # Calculate derived features (same as in API)
    debt_to_income_ratio = request_data["debt_amount"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0
    emi_to_income_ratio = request_data["monthly_emi"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0
    savings_to_income_ratio = request_data["savings"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0
    expense_to_income_ratio = request_data["expenses"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0

    # Estimate fixed and variable expenses (60% fixed, 40% variable as default)
    fixed_expenses = request_data["expenses"] * 0.6
    variable_expenses = request_data["expenses"] * 0.4

    features = np.array([[
        request_data["age"],                    # age
        request_data["monthly_income"],         # monthly_income
        request_data["expenses"],              # expenses
        fixed_expenses,                        # fixed_expenses (estimated)
        variable_expenses,                     # variable_expenses (estimated)
        request_data["debt_amount"],           # debt_amount
        request_data["monthly_emi"],           # monthly_emi
        request_data["savings"],               # savings
        request_data["emergency_fund"],        # emergency_fund
        debt_to_income_ratio,                  # debt_to_income_ratio
        emi_to_income_ratio,                   # emi_to_income_ratio
        savings_to_income_ratio,               # savings_to_income_ratio
        expense_to_income_ratio,               # expense_to_income_ratio
        1 if request_data["has_loans"] else 0, # has_loans_binary
        0,                                     # invests_binary (default False)
        0,                                     # occupation_encoded (default 0 for Salaried)
        0,                                     # investment_type_encoded (default 0)
        1,                                     # risk_appetite_encoded (default 1 for Medium)
        0,                                     # short_term_goals_encoded (default 0)
        1,                                     # long_term_goals_encoded (default 1)
        0                                      # additional encoded feature
    ]])

    print(f"✅ Features prepared: shape {features.shape}")
    print(f"Feature values: {features[0]}")

    return features

def test_model_predictions(models, scaler, features):
    """Test model predictions with the prepared features"""
    print("\nTesting model predictions...")

    try:
        # Scale features
        print("Scaling features...")
        features_scaled = scaler.transform(features)
        print(f"✅ Features scaled: shape {features_scaled.shape}")

        # Test each model
        print("Testing risk model...")
        risk_score = models['risk_model'].predict_proba(features_scaled)[0][1]
        print(f"✅ Risk model prediction: {risk_score}")

        print("Testing debt capacity model...")
        debt_capacity = models['debt_capacity_model'].predict(features_scaled)[0]
        print(f"✅ Debt capacity prediction: {debt_capacity}")

        print("Testing financial health model...")
        financial_health_pred = models['financial_health_model'].predict(features_scaled)[0]
        print(f"✅ Financial health prediction: {financial_health_pred}")

        print("Testing clustering model...")
        cluster_features = features_scaled[:, :8]
        cluster = models['clustering_model'].predict(cluster_features)[0]
        print(f"✅ Clustering prediction: {cluster}")

        print("\n🎉 All model predictions successful!")
        return True

    except Exception as e:
        print(f"❌ Model prediction failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing debt analysis pipeline...")
    print("=" * 50)

    # Test model loading
    models, scaler = test_model_loading()
    if not models or not scaler:
        print("❌ Failed to load models/scaler")
        sys.exit(1)

    # Test feature preparation
    features = test_feature_preparation()

    # Test model predictions
    success = test_model_predictions(models, scaler, features)

    if success:
        print("\n✅ Debt analysis pipeline test passed!")
    else:
        print("\n❌ Debt analysis pipeline test failed!")
