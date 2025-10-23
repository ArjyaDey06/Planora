from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import logging
from typing import List, Dict, Any, Optional
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Planora AI Financial Advisor", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store loaded models
models: Dict[str, Any] = {}
scaler = None
dataset = None

# Investment Analysis (simple rules fallback)
from simple_investment_analysis import analyze_investment_profile  # absolute import; working directory is backend/

class InvestmentProfileRequest(BaseModel):
    risk_appetite: str
    investment_timeframe: str
    monthly_investment: float
    experience_level: int
    loss_tolerance: int
    current_investments: List[str]
    expected_returns: int
    management_style: str

@app.post("/analyze-investment-profile")
async def get_investment_analysis(data: InvestmentProfileRequest):
    try:
        analysis = analyze_investment_profile(data.dict())
        return analysis
    except Exception as e:
        logger.error(f"Error in investment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze investment profile: {str(e)}")

@app.post("/prepare-investment-models")
async def prepare_models():
    try:
        # Lazy absolute import; working directory is backend/
        from investment_analysis import prepare_investment_data  # type: ignore
        prepare_investment_data()
        return {"message": "Investment models prepared successfully"}
    except Exception as e:
        logger.error(f"Error preparing investment models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to prepare investment models: {str(e)}")

# Pydantic models for request/response
class DebtAnalysisRequest(BaseModel):
    monthly_income: float
    expenses: float
    savings: float
    emergency_fund: float
    debt_amount: float
    monthly_emi: float
    age: Optional[int] = 30
    occupation: Optional[str] = "Salaried"
    has_loans: Optional[bool] = True
    
class DebtAnalysisResponse(BaseModel):
    risk_score: float
    risk_category: str
    debt_capacity: float
    recommended_emi: float
    financial_health: str
    recommendations: List[str]
    cluster_analysis: Dict[str, Any]
    confidence_score: float

class UserProfileRequest(BaseModel):
    age: int
    occupation: str
    monthly_income: float
    expenses: float
    fixed_expenses: float
    variable_expenses: float
    has_loans: bool
    debt_amount: float
    monthly_emi: float
    savings: float
    emergency_fund: float
    invests: bool
    investment_type: Optional[str] = None
    risk_appetite: str
    short_term_goals: str
    long_term_goals: str

@app.on_event("startup")
async def startup_event():
    """Load models and dataset on startup"""
    global models, scaler, dataset
    
    try:
        # Load dataset
        dataset_path = os.path.join(os.path.dirname(__file__), "..", "synthetic_planora_dataset.csv")
        if os.path.exists(dataset_path):
            dataset = pd.read_csv(dataset_path)
            logger.info(f"Dataset loaded with {len(dataset)} records")
        else:
            logger.error(f"Dataset not found at {dataset_path}")
            
        # Load pre-trained models if they exist
        model_dir = os.path.join(os.path.dirname(__file__), "models")
        if os.path.exists(model_dir):
            for model_file in os.listdir(model_dir):
                if model_file.endswith('.joblib'):
                    model_name = model_file.replace('.joblib', '')
                    model_path = os.path.join(model_dir, model_file)
                    models[model_name] = joblib.load(model_path)
                    logger.info(f"Loaded model: {model_name}")
                    
            # Load scaler if exists
            scaler_path = os.path.join(model_dir, "scaler.joblib")
            if os.path.exists(scaler_path):
                scaler = joblib.load(scaler_path)
                logger.info("Scaler loaded")
        else:
            logger.warning("Models directory not found. Models need to be trained first.")
            
    except Exception as e:
        logger.error(f"Error during startup: {e}")

@app.get("/")
async def root():
    return {"message": "Planora AI Financial Advisor API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": len(models),
        "dataset_loaded": dataset is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/analyze-debt", response_model=DebtAnalysisResponse)
async def analyze_debt(request: DebtAnalysisRequest):
    """Comprehensive debt analysis using ML models"""
    try:
        if not models or not scaler:
            raise HTTPException(status_code=503, detail="Models not loaded. Please train models first.")
            
        # Prepare input features to match training data (21 features)
        # Calculate derived features
        debt_to_income_ratio = request.debt_amount / request.monthly_income if request.monthly_income > 0 else 0
        emi_to_income_ratio = request.monthly_emi / request.monthly_income if request.monthly_income > 0 else 0
        savings_to_income_ratio = request.savings / request.monthly_income if request.monthly_income > 0 else 0
        expense_to_income_ratio = request.expenses / request.monthly_income if request.monthly_income > 0 else 0
        
        # Estimate fixed and variable expenses (60% fixed, 40% variable as default)
        fixed_expenses = request.expenses * 0.6
        variable_expenses = request.expenses * 0.4
        
        features = np.array([[
            request.age,                    # age
            request.monthly_income,         # monthly_income
            request.expenses,              # expenses
            fixed_expenses,                # fixed_expenses (estimated)
            variable_expenses,             # variable_expenses (estimated)
            request.debt_amount,           # debt_amount
            request.monthly_emi,           # monthly_emi
            request.savings,               # savings
            request.emergency_fund,        # emergency_fund
            debt_to_income_ratio,          # debt_to_income_ratio
            emi_to_income_ratio,           # emi_to_income_ratio
            savings_to_income_ratio,       # savings_to_income_ratio
            expense_to_income_ratio,       # expense_to_income_ratio
            1 if request.has_loans else 0, # has_loans_binary
            0,                             # invests_binary (default False)
            0,                             # occupation_encoded (default 0 for Salaried)
            0,                             # investment_type_encoded (default 0)
            1,                             # risk_appetite_encoded (default 1 for Medium)
            0,                             # short_term_goals_encoded (default 0)
            1,                             # long_term_goals_encoded (default 1)
            0                              # additional encoded feature
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Get predictions from different models
        risk_score = models['risk_model'].predict_proba(features_scaled)[0][1]  # Probability of high risk
        debt_capacity = models['debt_capacity_model'].predict(features_scaled)[0]
        financial_health_pred = models['financial_health_model'].predict(features_scaled)[0]
        
        # Clustering model uses only first 8 features (as per training)
        cluster_features = features_scaled[:, :8]
        cluster = models['clustering_model'].predict(cluster_features)[0]
        
        # Determine risk category
        if risk_score > 0.7:
            risk_category = "High Risk"
        elif risk_score > 0.4:
            risk_category = "Medium Risk"
        else:
            risk_category = "Low Risk"
            
        # Map financial health prediction
        health_mapping = {0: "Good", 1: "Average", 2: "Poor"}
        financial_health = health_mapping.get(financial_health_pred, "Average")
        
        # Calculate recommended EMI (30% of income or current EMI, whichever is lower)
        recommended_emi = min(request.monthly_income * 0.30, debt_capacity * 0.05)
        
        # Generate recommendations based on analysis
        recommendations = generate_recommendations(
            risk_score, debt_to_income_ratio, emi_to_income_ratio, 
            request.monthly_income, request.debt_amount, request.savings
        )
        
        # Cluster analysis
        cluster_analysis = analyze_cluster(cluster, features_scaled[0])
        
        # Calculate confidence score
        confidence_score = calculate_confidence(risk_score, debt_to_income_ratio, emi_to_income_ratio)
        
        return DebtAnalysisResponse(
            risk_score=float(risk_score),
            risk_category=risk_category,
            debt_capacity=float(debt_capacity),
            recommended_emi=float(recommended_emi),
            financial_health=financial_health,
            recommendations=recommendations,
            cluster_analysis=cluster_analysis,
            confidence_score=float(confidence_score)
        )
        
    except Exception as e:
        logger.error(f"Error in debt analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train-models")
async def train_models():
    """Trigger model training"""
    try:
        if dataset is None:
            raise HTTPException(status_code=400, detail="Dataset not loaded")
            
        # Import and run training
        from .ml_training import train_all_models
        try:
            from ml_training import train_all_models as train_all_models_abs  # type: ignore
            train_all_models = train_all_models_abs
        except Exception:
            pass
        result = await train_all_models(dataset)
        
        # Reload models after training
        await startup_event()
        
        return {"message": "Models trained successfully", "details": result}
        
    except Exception as e:
        logger.error(f"Error training models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset-stats")
async def get_dataset_stats():
    """Get basic statistics about the dataset"""
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not loaded")
        
    stats = {
        "total_records": len(dataset),
        "columns": list(dataset.columns),
        "financial_health_distribution": dataset['financial_health'].value_counts().to_dict(),
        "age_stats": {
            "mean": float(dataset['age'].mean()),
            "min": int(dataset['age'].min()),
            "max": int(dataset['age'].max())
        },
        "income_stats": {
            "mean": float(dataset['monthly_income'].mean()),
            "median": float(dataset['monthly_income'].median()),
            "min": float(dataset['monthly_income'].min()),
            "max": float(dataset['monthly_income'].max())
        },
        "debt_stats": {
            "mean": float(dataset['debt_amount'].mean()),
            "median": float(dataset['debt_amount'].median()),
            "percentage_with_debt": float((dataset['has_loans'] == True).mean() * 100)
        }
    }
    
    return stats


def generate_recommendations(risk_score: float, debt_ratio: float, emi_ratio: float, 
                           income: float, debt: float, savings: float) -> List[str]:
    """Generate personalized debt management recommendations"""
    recommendations: List[str] = []
    
    if risk_score > 0.7:
        recommendations.append("🚨 High Risk Alert: Consider immediate debt consolidation or financial counseling")
        
    if emi_ratio > 0.5:
        recommendations.append("💰 Your EMI burden is very high. Consider refinancing loans for lower rates")
        
    if emi_ratio > 0.4:
        recommendations.append("⚠️ EMI to income ratio is concerning. Focus on debt reduction strategies")
        
    if debt_ratio > 0.8:
        recommendations.append("📉 High debt-to-income ratio. Prioritize debt repayment over new investments")
        
    if savings < (income * 0.1):
        recommendations.append("💼 Build an emergency fund of at least 3-6 months of expenses")
        
    if debt > 0 and savings > (debt * 0.1):
        recommendations.append("🎯 Consider using part of savings for debt prepayment to save on interest")
        
    if len(recommendations) == 0:
        recommendations.append("✅ Your debt levels appear manageable. Continue monitoring and avoid taking on additional debt")
        
    return recommendations


def analyze_cluster(cluster_id: int, features: np.ndarray) -> Dict[str, Any]:
    """Analyze user's financial behavior cluster"""
    cluster_profiles = {
        0: {
            "profile": "Conservative Savers",
            "characteristics": ["Low debt", "High savings rate", "Risk-averse"],
            "advice": "Consider diversifying investments while maintaining financial discipline"
        },
        1: {
            "profile": "Balanced Borrowers", 
            "characteristics": ["Moderate debt", "Average savings", "Balanced approach"],
            "advice": "Focus on optimizing debt-to-income ratio and increasing savings"
        },
        2: {
            "profile": "High-Risk Borrowers",
            "characteristics": ["High debt burden", "Low savings", "High EMI ratio"],
            "advice": "Urgent debt restructuring needed. Consider professional financial counseling"
        }
    }
    
    profile = cluster_profiles.get(cluster_id, cluster_profiles[1])
    
    return {
        "cluster_id": int(cluster_id),
        "profile_name": profile["profile"],
        "characteristics": profile["characteristics"],
        "advice": profile["advice"],
        "similarity_score": float(np.random.uniform(0.7, 0.95))  # Placeholder for actual similarity calculation
    }


def calculate_confidence(risk_score: float, debt_ratio: float, emi_ratio: float) -> float:
    """Calculate confidence score for the analysis"""
    # Higher confidence when ratios are in normal ranges
    confidence = 1.0
    
    if debt_ratio > 1.0 or emi_ratio > 1.0:  # Extreme values reduce confidence
        confidence *= 0.7
    elif debt_ratio > 0.8 or emi_ratio > 0.5:  # High values reduce confidence
        confidence *= 0.85
        
    # Risk score confidence
    if 0.3 <= risk_score <= 0.7:  # Mid-range scores are less confident
        confidence *= 0.9
        
    return min(confidence, 1.0)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
