#!/usr/bin/env python3
"""
Planora Backend Server Startup Script
This script starts the FastAPI backend server for ML model serving.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import pandas
        import numpy
        import sklearn
        import xgboost
        import joblib
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Please install requirements: pip install -r backend/requirements.txt")
        return False

def check_models():
    """Check if trained models exist"""
    models_dir = Path("backend/models")
    if not models_dir.exists():
        print("❌ Models directory not found")
        print("Please train models first: python train_models.py")
        return False
    
    required_models = [
        "risk_model.joblib",
        "debt_capacity_model.joblib", 
        "financial_health_model.joblib",
        "clustering_model.joblib",
        "scaler.joblib"
    ]
    
    missing_models = []
    for model in required_models:
        if not (models_dir / model).exists():
            missing_models.append(model)
    
    if missing_models:
        print(f"❌ Missing models: {', '.join(missing_models)}")
        print("Please train models first: python train_models.py")
        return False
    
def check_goal_models():
    """Check if goal-based planning models exist"""
    models_dir = Path("backend/models")
    if not models_dir.exists():
        print("❌ Goal models directory not found")
        print("Please train goal models first: python train_goal_models.py")
        return False

    required_goal_models = [
        "goal_feasibility_model.joblib",
        "goal_priority_model.joblib",
        "goal_timeline_classifier.joblib",
        "goal_allocation_emergency_model.joblib",
        "goal_allocation_short_model.joblib",
        "goal_allocation_medium_model.joblib",
        "goal_allocation_long_model.joblib",
        "goal_scaler.joblib",
        "goal_label_encoders.joblib",
        "goal_tfidf_vectorizers.joblib"
    ]

    missing_goal_models = []
    for model in required_goal_models:
        if not (models_dir / model).exists():
            missing_goal_models.append(model)

    if missing_goal_models:
        print(f"❌ Missing goal models: {', '.join(missing_goal_models)}")
        print("Please train goal models first: python train_goal_models.py")
        return False

    print("✅ All required goal models are present")
    return True

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting Planora Backend Server...")
    print("=" * 50)
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("🔄 Health check at: http://localhost:8000/health")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = Path("backend")
    os.chdir(backend_dir)
    
    # Start uvicorn server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")

def main():
    """Main function"""
    print("🏦 Planora AI Financial Advisor Backend")
    print("=" * 40)
    
    # Check requirements
    if not check_requirements():
        return False
    
    # Check if models exist
    if not check_models():
        return False
    
    # Check if goal models exist
    if not check_goal_models():
        return False

    # Start server
    start_server()
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
