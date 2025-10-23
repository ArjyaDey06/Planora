#!/usr/bin/env python3
"""
Test the exact debt analysis response creation
"""
import sys
import os
import numpy as np
import joblib
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Add backend directory to path
sys.path.insert(0, 'd:/Planora/backend')

def test_response_creation():
    """Test creating the exact response that the API should return"""

    # Load models (same as startup_event does)
    models_dir = 'd:/Planora/backend/models'
    models = {}
    scaler = None

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
            if model == "scaler.joblib":
                scaler = joblib.load(model_path)
            else:
                models[model.replace('.joblib', '')] = joblib.load(model_path)

    print(f"✅ Loaded {len(models)} models and scaler")

    # Test data (same as API receives)
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

    print("Processing request data...")

    # Exact same logic as in API
    debt_to_income_ratio = request_data["debt_amount"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0
    emi_to_income_ratio = request_data["monthly_emi"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0
    savings_to_income_ratio = request_data["savings"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0
    expense_to_income_ratio = request_data["expenses"] / request_data["monthly_income"] if request_data["monthly_income"] > 0 else 0

    fixed_expenses = request_data["expenses"] * 0.6
    variable_expenses = request_data["expenses"] * 0.4

    features = np.array([[
        request_data["age"],
        request_data["monthly_income"],
        request_data["expenses"],
        fixed_expenses,
        variable_expenses,
        request_data["debt_amount"],
        request_data["monthly_emi"],
        request_data["savings"],
        request_data["emergency_fund"],
        debt_to_income_ratio,
        emi_to_income_ratio,
        savings_to_income_ratio,
        expense_to_income_ratio,
        1 if request_data["has_loans"] else 0,
        0, 0, 0, 1, 0, 1, 0
    ]])

    print(f"Features shape: {features.shape}")

    # Scale and predict (same as API)
    features_scaled = scaler.transform(features)

    risk_score = models['risk_model'].predict_proba(features_scaled)[0][1]
    debt_capacity = models['debt_capacity_model'].predict(features_scaled)[0]
    financial_health_pred = models['financial_health_model'].predict(features_scaled)[0]

    cluster_features = features_scaled[:, :8]
    cluster = models['clustering_model'].predict(cluster_features)[0]

    print(f"✅ Model predictions: risk={risk_score:.3f}, debt_capacity={debt_capacity:.0f}, health={financial_health_pred}, cluster={cluster}")

    # Test response creation with Pydantic model
    class DebtAnalysisResponse(BaseModel):
        risk_score: float
        risk_category: str
        debt_capacity: float
        recommended_emi: float
        financial_health: str
        recommendations: List[str]
        cluster_analysis: Dict[str, Any]
        confidence_score: float

    # Generate recommendations (simplified version)
    recommendations = []
    if risk_score > 0.7:
        recommendations.append("High Risk Alert: Consider immediate debt consolidation")
    if emi_to_income_ratio > 0.5:
        recommendations.append("High EMI burden. Consider refinancing")
    if len(recommendations) == 0:
        recommendations.append("Your debt levels appear manageable")

    # Analyze cluster
    cluster_profiles = {
        0: {"profile": "Conservative Savers", "characteristics": ["Low debt"], "advice": "Good job!"},
        1: {"profile": "Balanced Borrowers", "characteristics": ["Moderate debt"], "advice": "Balance is good"},
        2: {"profile": "High-Risk Borrowers", "characteristics": ["High debt"], "advice": "Be careful"}
    }
    profile = cluster_profiles.get(cluster, cluster_profiles[1])

    cluster_analysis = {
        "cluster_id": int(cluster),
        "profile_name": profile["profile"],
        "characteristics": profile["characteristics"],
        "advice": profile["advice"],
        "similarity_score": float(np.random.uniform(0.7, 0.95))
    }

    # Determine risk category and health
    if risk_score > 0.7:
        risk_category = "High Risk"
    elif risk_score > 0.4:
        risk_category = "Medium Risk"
    else:
        risk_category = "Low Risk"

    health_mapping = {0: "Good", 1: "Average", 2: "Poor"}
    financial_health = health_mapping.get(financial_health_pred, "Average")

    recommended_emi = min(request_data["monthly_income"] * 0.30, debt_capacity * 0.05)

    confidence_score = 1.0
    if debt_to_income_ratio > 1.0 or emi_to_income_ratio > 1.0:
        confidence_score *= 0.7

    print("Creating response object...")

    try:
        response = DebtAnalysisResponse(
            risk_score=float(risk_score),
            risk_category=risk_category,
            debt_capacity=float(debt_capacity),
            recommended_emi=float(recommended_emi),
            financial_health=financial_health,
            recommendations=recommendations,
            cluster_analysis=cluster_analysis,
            confidence_score=float(confidence_score)
        )

        print("✅ Response object created successfully")
        print(f"Response dict: {response.dict()}")

        # Test JSON serialization
        import json
        json_str = response.json()
        print("✅ JSON serialization successful")
        print(f"JSON length: {len(json_str)} characters")

        return True

    except Exception as e:
        print(f"❌ Response creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing debt analysis response creation...")
    print("=" * 50)

    success = test_response_creation()

    if success:
        print("\n✅ Response creation test passed!")
    else:
        print("\n❌ Response creation test failed!")
