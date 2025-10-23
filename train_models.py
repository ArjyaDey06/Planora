#!/usr/bin/env python3
"""
Planora ML Model Training Script
This script trains all the machine learning models for debt management analysis.
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.append(str(backend_dir))

from ml_training import DebtManagementMLTrainer

# Enhanced ML models for comprehensive debt analysis
MODELS_TO_TRAIN = [
    'risk_assessment',           # Predicts risk level
    'debt_capacity',            # Predicts maximum safe debt
    'repayment_strategy',       # Recommends optimal repayment strategy
    'financial_health',         # Assesses overall financial health
    'behavior_clustering',      # Clusters similar financial behaviors
    'credit_impact'            # Predicts credit score impact
]

def main():
    """Main training function with enhanced ML capabilities"""
    print("🚀 Starting Planora ML Model Training")
    print("=" * 50)
    
    # Check if dataset exists
    dataset_path = "synthetic_planora_dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found at {dataset_path}")
        print("Please ensure the synthetic_planora_dataset.csv file is in the project root.")
        return False
    
    try:
        # Initialize trainer
        trainer = DebtManagementMLTrainer(dataset_path)
        
        # Train all models
        print("🔄 Training models... This may take a few minutes.")
        results = trainer.train_all_models()
        
        # Display results
        print("\n✅ MODEL TRAINING COMPLETED SUCCESSFULLY!")
        print("=" * 50)
        print(f"📊 Dataset size: {results['dataset_size']:,} records")
        print(f"🔧 Features used: {results['feature_count']}")
        print(f"🤖 Models trained: {results['models_trained']}")
        
        print("\n📈 Model Performance Summary:")
        print("-" * 30)
        
        for model_name, metrics in results['results'].items():
            print(f"\n🎯 {model_name.replace('_', ' ').title()}:")
            for metric, value in metrics.items():
                if isinstance(value, float):
                    print(f"   {metric}: {value:.3f}")
                else:
                    print(f"   {metric}: {value}")
        
        print(f"\n💾 Models saved to: backend/models/")
        print("🎉 Ready to serve predictions via API!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
