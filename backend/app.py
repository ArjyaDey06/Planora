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

# Global variables for models and data
models = {}
scaler = None
dataset = None

# Load goal-based planning ML models
goal_models = {}
goal_scaler = None
goal_label_encoders = {}
goal_tfidf_vectorizers = {}
goal_svd_transformers = {}

def load_goal_models():
    """Load goal-based planning ML models"""
    global goal_models, goal_scaler, goal_label_encoders, goal_tfidf_vectorizers, goal_svd_transformers

    models_dir = os.path.join(os.path.dirname(__file__), "models")

    try:
        goal_models['feasibility'] = joblib.load(os.path.join(models_dir, 'goal_feasibility_model.joblib'))
        goal_models['priority'] = joblib.load(os.path.join(models_dir, 'goal_priority_model.joblib'))
        goal_models['timeline'] = joblib.load(os.path.join(models_dir, 'goal_timeline_classifier.joblib'))

        # Load allocation models
        for category in ['emergency', 'short', 'medium', 'long']:
            goal_models[f'allocation_{category}'] = joblib.load(
                os.path.join(models_dir, f'goal_allocation_{category}_model.joblib')
            )

        # Load supporting objects
        goal_scaler = joblib.load(os.path.join(models_dir, 'goal_scaler.joblib'))
        goal_label_encoders = joblib.load(os.path.join(models_dir, 'goal_label_encoders.joblib'))
        goal_tfidf_vectorizers = joblib.load(os.path.join(models_dir, 'goal_tfidf_vectorizers.joblib'))
        # Load SVD transformers for text features
        svd_path = os.path.join(models_dir, 'goal_svd_transformers.joblib')
        if os.path.exists(svd_path):
            goal_svd_transformers = joblib.load(svd_path)

        logger.info("Goal-based planning models loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading goal models: {e}")
        return False

# Investment Analysis Models
from simple_investment_analysis import analyze_investment_profile

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
        # Lazy import to avoid breaking app startup if module has issues
        from investment_analysis import prepare_investment_data
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
        
        # Calculate derived metrics
        debt_to_income_ratio = request.debt_amount / request.monthly_income if request.monthly_income > 0 else 0
        emi_to_income_ratio = request.monthly_emi / request.monthly_income if request.monthly_income > 0 else 0
        
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
        from ml_training import train_all_models
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
    recommendations = []
    
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
        
# Pydantic models for goal-based planning request/response
class GoalBasedPlanningRequest(BaseModel):
    shortTermGoals: str
    mediumTermGoals: str
    longTermGoals: str
    retirementPlan: str
    houseCarPurchase: str
    childrenEducationWedding: str
    startBusiness: str
    travelLifestyleGoals: str
    goalPriorities: str
    goalTimelines: str
    
class GoalBasedPlanningResponse(BaseModel):
    goals: Dict[str, List[str]]
    priorities: Dict[str, Dict[str, Any]]
    timelineAnalysis: Dict[str, List[str]]
    feasibilityScores: Dict[str, float]
    recommendations: List[Dict[str, str]]
    investmentAllocation: Dict[str, int]
    confidenceScore: float

@app.post("/analyze-goal-based-planning")
async def analyze_goal_based_planning(data: GoalBasedPlanningRequest):
    try:
        analysis = analyze_goal_data(data.dict())
        return GoalBasedPlanningResponse(**analysis)
    except Exception as e:
        logger.error(f"Error in goal-based planning analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze goal-based planning: {str(e)}")

def analyze_goal_data(data: dict) -> dict:
    """Analyze goal-based planning data using ML models"""
    # Extract goals from the form data
    goals = {
        'shortTerm': [g.strip() for g in data.get('shortTermGoals', '').split(',') if g.strip()],
        'mediumTerm': [g.strip() for g in data.get('mediumTermGoals', '').split(',') if g.strip()],
        'longTerm': [g.strip() for g in data.get('longTermGoals', '').split(',') if g.strip()],
        'retirement': [g.strip() for g in data.get('retirementPlan', '').split(',') if g.strip()],
        'houseCar': [g.strip() for g in data.get('houseCarPurchase', '').split(',') if g.strip()],
        'childrenEducation': [g.strip() for g in data.get('childrenEducationWedding', '').split(',') if g.strip()],
        'business': [g.strip() for g in data.get('startBusiness', '').split(',') if g.strip()],
        'travelLifestyle': [g.strip() for g in data.get('travelLifestyleGoals', '').split(',') if g.strip()]
    }

    # Filter out empty categories
    goals = {k: v for k, v in goals.items() if v}

    # Create user profile for ML prediction
    user_profile = create_user_profile_for_ml(data, goals)

    # Get ML predictions
    ml_predictions = get_ml_goal_predictions(user_profile)

    # Process raw predictions into structured analysis
    priorities = process_priority_predictions(goals, ml_predictions)
    timeline_analysis = process_timeline_predictions(goals, ml_predictions)
    feasibility_scores = process_feasibility_predictions(goals, ml_predictions)
    investment_allocation = process_allocation_predictions(ml_predictions)
    recommendations = generate_ml_recommendations(goals, priorities, feasibility_scores, ml_predictions)

    # Calculate confidence score using ML model confidence
    confidence_score = calculate_ml_confidence_score(ml_predictions)

    return {
        'goals': goals,
        'priorities': priorities,
        'timelineAnalysis': timeline_analysis,
        'feasibilityScores': feasibility_scores,
        'recommendations': recommendations,
        'investmentAllocation': investment_allocation,
        'confidenceScore': confidence_score,
        'mlInsights': ml_predictions  # Include raw ML predictions for transparency
    }

def create_user_profile_for_ml(data: dict, goals: dict) -> dict:
    """Create a user profile suitable for ML model input"""
    # Extract numerical features from form data
    profile = {
        'age': int(data.get('age', 30)),
        'monthly_income': float(data.get('monthly_income', 50000)),
        'expenses': float(data.get('expenses', 30000)),
        'savings': float(data.get('savings', 10000)),
        'emergency_fund': float(data.get('emergency_fund', 50000)),
        'debt_amount': float(data.get('debt_amount', 0)),
        'monthly_emi': float(data.get('monthly_emi', 0)),
        'has_loans': data.get('has_loans', False),
        'invests': data.get('invests', False),
        'occupation': data.get('occupation', 'Salaried'),
        'investment_type': data.get('investment_type', 'None'),
        'risk_appetite': data.get('risk_appetite', 'Moderate'),
        'short_term_goals_text': ', '.join(goals.get('shortTerm', [])),
        'long_term_goals_text': ', '.join(goals.get('longTerm', []))
    }

    return profile

def get_ml_goal_predictions(user_profile: dict) -> dict:
    """Get predictions from all ML models"""
    if not goal_models:
        logger.warning("Goal models not loaded, using fallback predictions")
        return get_fallback_predictions(user_profile)

    try:
        # Prepare features for ML models
        features = prepare_ml_features(user_profile)

        predictions = {}

        # Get feasibility prediction
        if 'feasibility' in goal_models:
            predictions['feasibility_score'] = float(goal_models['feasibility'].predict([features])[0])

        # Get priority prediction
        if 'priority' in goal_models:
            predictions['priority_score'] = float(goal_models['priority'].predict([features])[0])

        # Get timeline prediction
        if 'timeline' in goal_models:
            timeline_pred = goal_models['timeline'].predict([features])[0]
            timeline_map = {0: 'shortTerm', 1: 'mediumTerm', 2: 'longTerm'}
            predictions['timeline_category'] = timeline_map.get(timeline_pred, 'mediumTerm')

        # Get allocation predictions
        for category in ['emergency', 'short', 'medium', 'long']:
            model_key = f'allocation_{category}'
            if model_key in goal_models:
                allocation = goal_models[model_key].predict([features])[0]
                predictions[f'allocation_{category}'] = max(5, min(50, float(allocation)))

        # Ensure allocations sum to 100%
        total_allocation = sum(predictions.get(f'allocation_{cat}', 25)
                             for cat in ['emergency', 'short', 'medium', 'long'])
        if total_allocation != 100:
            # Distribute the difference to long-term
            predictions['allocation_long'] = predictions.get('allocation_long', 25) + (100 - total_allocation)

        return predictions

    except Exception as e:
        logger.error(f"Error getting ML predictions: {e}")
        return get_fallback_predictions(user_profile)

def get_fallback_predictions(user_profile: dict) -> dict:
    """Provide fallback predictions when ML models are not available"""
    return {
        'feasibility_score': 65.0,
        'priority_score': 70.0,
        'timeline_category': 'mediumTerm',
        'allocation_emergency': 25,
        'allocation_short': 20,
        'allocation_medium': 25,
        'allocation_long': 30
    }

def prepare_ml_features(user_profile: dict) -> np.ndarray:
    """Prepare features for ML model input"""
    # Base numerical features
    features = [
        user_profile['age'],
        user_profile['monthly_income'],
        user_profile['expenses'],
        user_profile['savings'],
        user_profile['emergency_fund'],
        user_profile['debt_amount'],
        user_profile['monthly_emi'],
        1.0 if user_profile['has_loans'] else 0.0,
        1.0 if user_profile['invests'] else 0.0
    ]

    # Calculate derived ratios
    income = user_profile['monthly_income']
    if income > 0:
        features.extend([
            user_profile['debt_amount'] / income,  # debt_to_income_ratio
            user_profile['savings'] / income,      # savings_to_income_ratio
            user_profile['expenses'] / income,     # expense_to_income_ratio
            user_profile['emergency_fund'] / income  # emergency_fund_ratio
        ])
    else:
        features.extend([0.0, 0.0, 0.0, 0.0])

    # Encode categorical features
    if goal_label_encoders:
        try:
            features.append(goal_label_encoders.get('occupation', {}).transform([user_profile['occupation']])[0])
            features.append(goal_label_encoders.get('investment_type', {}).transform([user_profile['investment_type']])[0])
            features.append(goal_label_encoders.get('risk_appetite', {}).transform([user_profile['risk_appetite']])[0])
        except:
            features.extend([1.0, 0.0, 1.0])  # Default encoded values

    # Process text features with TF-IDF + SVD (to mirror training)
    if goal_tfidf_vectorizers:
        try:
            short_tfidf = goal_tfidf_vectorizers.get('short_term_goals', {}).transform([user_profile['short_term_goals_text']])
            long_tfidf = goal_tfidf_vectorizers.get('long_term_goals', {}).transform([user_profile['long_term_goals_text']])

            # Apply SVD transformers if available, otherwise fallback to zeros
            short_svd = None
            long_svd = None
            if goal_svd_transformers:
                try:
                    svd_short = goal_svd_transformers.get('short_term_goals', None)
                    if svd_short is not None:
                        short_svd = svd_short.transform(short_tfidf)[0].tolist()
                except Exception:
                    short_svd = None
                try:
                    svd_long = goal_svd_transformers.get('long_term_goals', None)
                    if svd_long is not None:
                        long_svd = svd_long.transform(long_tfidf)[0].tolist()
                except Exception:
                    long_svd = None

            # Determine component sizes (default to 10 each)
            if short_svd is not None:
                features.extend(short_svd)
            else:
                default_len = getattr(goal_svd_transformers.get('short_term_goals', None), 'n_components', 10) if goal_svd_transformers else 10
                features.extend([0.0] * int(default_len))

            if long_svd is not None:
                features.extend(long_svd)
            else:
                default_len = getattr(goal_svd_transformers.get('long_term_goals', None), 'n_components', 10) if goal_svd_transformers else 10
                features.extend([0.0] * int(default_len))
        except Exception:
            # Fallback if vectorizers or svd fail
            features.extend([0.0] * 20)

    # Scale features
    if goal_scaler:
        features = goal_scaler.transform([features])

    return np.array(features)

def process_priority_predictions(goals: dict, ml_predictions: dict) -> dict:
    """Process ML priority predictions into structured format"""
    priorities = {}

    # Use ML priority score as base
    base_priority_score = ml_predictions.get('priority_score', 70)

    for category, goal_list in goals.items():
        if goal_list:
            # Adjust priority based on category and ML insights
            category_multiplier = {
                'retirement': 1.2,
                'childrenEducation': 1.1,
                'houseCar': 1.0,
                'business': 0.9,
                'travelLifestyle': 0.8,
                'shortTerm': 0.7,
                'mediumTerm': 0.9,
                'longTerm': 1.1
            }

            adjusted_score = base_priority_score * category_multiplier.get(category, 1.0)

            priorities[category] = {
                'score': base_priority_score,
                'normalizedScore': min(100, adjusted_score),
                'goals': goal_list,
                'ml_prediction': True
            }

    return priorities

def process_timeline_predictions(goals: dict, ml_predictions: dict) -> dict:
    """Process ML timeline predictions into structured format"""
    timelines = {
        'immediate': [],
        'shortTerm': [],
        'mediumTerm': [],
        'longTerm': []
    }

    # Use ML timeline prediction as primary guide
    primary_timeline = ml_predictions.get('timeline_category', 'mediumTerm')

    # Map goals to timelines based on ML prediction and category
    timeline_mapping = {
        'shortTerm': 'shortTerm',
        'houseCar': 'mediumTerm',
        'business': 'mediumTerm',
        'childrenEducation': 'longTerm',
        'retirement': 'longTerm',
        'longTerm': 'longTerm',
        'travelLifestyle': 'mediumTerm'
    }

    for category, goal_list in goals.items():
        # Use ML prediction if available, otherwise use rule-based mapping
        if ml_predictions.get('timeline_category'):
            # Weight towards ML prediction
            if primary_timeline == 'shortTerm' and category in ['shortTerm', 'travelLifestyle']:
                timeline_category = 'shortTerm'
            elif primary_timeline == 'longTerm' and category in ['retirement', 'childrenEducation', 'longTerm']:
                timeline_category = 'longTerm'
            else:
                timeline_category = timeline_mapping.get(category, 'mediumTerm')
        else:
            timeline_category = timeline_mapping.get(category, 'mediumTerm')

        if goal_list:
            for goal in goal_list:
                goal_with_context = f"{goal} ({category})"
                timelines[timeline_category].append(goal_with_context)

    return timelines

def process_feasibility_predictions(goals: dict, ml_predictions: dict) -> dict:
    """Process ML feasibility predictions into structured format"""
    scores = {}

    # Use ML feasibility score as base
    base_feasibility = ml_predictions.get('feasibility_score', 65)

    for category, goal_list in goals.items():
        if goal_list:
            # Adjust feasibility based on category characteristics
            category_adjustments = {
                'retirement': 5,      # Generally feasible with planning
                'shortTerm': 10,     # Most achievable
                'houseCar': -5,      # Expensive, needs careful planning
                'business': -10,     # High risk, variable feasibility
                'childrenEducation': 5,   # Important, plannable
                'travelLifestyle': 0,     # Depends on lifestyle
                'longTerm': 8        # Long horizon makes it more feasible
            }

            adjusted_score = base_feasibility + category_adjustments.get(category, 0)

            # Further adjust based on goal detail level (more detail = more realistic)
            avg_detail_length = sum(len(goal) for goal in goal_list) / len(goal_list)
            if avg_detail_length > 100:
                adjusted_score += 15
            elif avg_detail_length > 50:
                adjusted_score += 8

            scores[category] = max(0, min(100, adjusted_score))

    return scores

def process_allocation_predictions(ml_predictions: dict) -> dict:
    """Process ML allocation predictions into investment allocation"""
    allocation = {
        'emergencyFund': ml_predictions.get('allocation_emergency', 25),
        'shortTerm': ml_predictions.get('allocation_short', 25),
        'mediumTerm': ml_predictions.get('allocation_medium', 25),
        'longTerm': ml_predictions.get('allocation_long', 25)
    }

    # Ensure total adds up to 100%
    total = sum(allocation.values())
    if total != 100:
        # Adjust longTerm to balance
        allocation['longTerm'] += (100 - total)

    return allocation

def generate_ml_recommendations(goals: dict, priorities: dict, feasibility_scores: dict, ml_predictions: dict) -> List[dict]:
    """Generate recommendations using ML insights"""
    recommendations = []

    # High priority, high feasibility goals (ML-enhanced)
    for category, priority in priorities.items():
        if priority['normalizedScore'] > 60 and feasibility_scores.get(category, 0) > 70:
            recommendations.append({
                'type': 'high_priority_feasible',
                'category': category,
                'title': f"Focus on {category.replace('_', ' ').title()}",
                'message': f"ML analysis shows your {category} goals are both high priority and highly feasible. Prioritize these for maximum impact.",
                'action': 'Start planning and allocating resources immediately',
                'priority': 'high',
                'confidence': ml_predictions.get('feasibility_score', 65) / 100
            })

    # Low feasibility but high priority goals (ML-enhanced)
    for category, priority in priorities.items():
        if priority['normalizedScore'] > 60 and feasibility_scores.get(category, 0) < 50:
            recommendations.append({
                'type': 'review_adjust',
                'category': category,
                'title': f"Review {category.replace('_', ' ').title()} Goals",
                'message': f"ML analysis indicates your {category} goals are important but may need adjustment for better feasibility.",
                'action': 'Consider adjusting timeline, budget, or scope based on ML recommendations',
                'priority': 'medium',
                'confidence': ml_predictions.get('feasibility_score', 65) / 100
            })

    # Many goals - focus recommendation (ML-enhanced)
    if len(goals) > 5:
        recommendations.append({
            'type': 'focus_management',
            'category': 'general',
            'title': 'Goal Focus Strategy',
            'message': f'ML analysis suggests you have {len(goals)} goals. Consider focusing on 2-3 highest priority goals first.',
            'action': 'Create a goal hierarchy and tackle one goal at a time',
            'priority': 'medium',
            'confidence': 0.8
        })

    # Emergency fund recommendation (ML-enhanced)
    if not any('emergency' in str(goals).lower() for goals_list in goals.values()):
        emergency_alloc = ml_predictions.get('allocation_emergency', 25)
        recommendations.append({
            'type': 'missing_emergency_fund',
            'category': 'emergency',
            'title': 'Consider Emergency Fund',
            'message': f'ML analysis recommends a {emergency_alloc}% allocation to emergency fund for financial security.',
            'action': 'Start building 3-6 months of expenses as an emergency fund',
            'priority': 'high',
            'confidence': 0.9
        })

    # Add ML confidence indicator
    if ml_predictions.get('feasibility_score'):
        recommendations.append({
            'type': 'ml_insights',
            'category': 'general',
            'title': 'ML Analysis Confidence',
            'message': f'Analysis confidence: {ml_predictions["feasibility_score"]:.1f}%. Higher scores indicate more reliable predictions.',
            'action': 'Review and adjust based on your personal circumstances',
            'priority': 'low',
            'confidence': 1.0
        })

    # Sort recommendations by priority and confidence
    priority_order = {'high': 3, 'medium': 2, 'low': 1}
    recommendations.sort(key=lambda x: (
        priority_order.get(x.get('priority', 'medium'), 2),
        x.get('confidence', 0.5)
    ), reverse=True)

    return recommendations

def calculate_ml_confidence_score(ml_predictions: dict) -> float:
    """Calculate confidence score based on ML model predictions"""
    if not ml_predictions:
        return 0.0

    # Base confidence from feasibility score
    base_confidence = ml_predictions.get('feasibility_score', 65) / 100

    # Adjust based on prediction consistency
    allocations = [
        ml_predictions.get('allocation_emergency', 25),
        ml_predictions.get('allocation_short', 25),
        ml_predictions.get('allocation_medium', 25),
        ml_predictions.get('allocation_long', 25)
    ]

    # Lower confidence if allocations are too extreme
    if max(allocations) > 60 or min(allocations) < 10:
        base_confidence *= 0.8

    return min(1.0, base_confidence)

def calculate_goal_priorities(goals: dict) -> dict:
    """Calculate priority scores for different goal categories"""
    priorities = {}

    for category, goal_list in goals.items():
        if goal_list:
            # Simple priority scoring based on detail level and specificity
            detail_score = sum(len(goal) for goal in goal_list)
            count_score = len(goal_list) * 10

            total_score = detail_score + count_score

            # Normalize to 0-100 scale based on maximum possible score
            max_possible = 500  # Assume max detail per goal
            normalized_score = min(100, (total_score / max_possible) * 100)

            priorities[category] = {
                'score': total_score,
                'normalizedScore': normalized_score,
                'goals': goal_list
            }

    return priorities

def generate_goal_timeline_analysis(goals: dict) -> dict:
    """Categorize goals by timeline"""
    timelines = {
        'immediate': [],
        'shortTerm': [],
        'mediumTerm': [],
        'longTerm': []
    }

    # Timeline mapping based on goal types
    timeline_mapping = {
        'shortTerm': 'shortTerm',
        'houseCar': 'mediumTerm',
        'business': 'mediumTerm',
        'childrenEducation': 'longTerm',
        'retirement': 'longTerm',
        'longTerm': 'longTerm',
        'travelLifestyle': 'mediumTerm'
    }

    for category, goal_list in goals.items():
        timeline_category = timeline_mapping.get(category, 'shortTerm')
        if goal_list:
            # Add goals with their category for reference
            for goal in goal_list:
                goal_with_context = f"{goal} ({category})"
                timelines[timeline_category].append(goal_with_context)

    return timelines

def calculate_goal_feasibility_scores(goals: dict) -> dict:
    """Calculate feasibility scores for goals using ML insights"""
    scores = {}

    # Load dataset for comparison if available
    try:
        if dataset is not None:
            # Use dataset statistics for more accurate scoring
            avg_income = dataset['monthly_income'].mean()
            avg_savings_rate = (dataset['savings'] / dataset['monthly_income']).mean()

            for category, goal_list in goals.items():
                if goal_list:
                    # Base feasibility score
                    base_score = 50

                    # Adjust based on goal type and market data
                    category_adjustments = {
                        'retirement': 15,  # Generally feasible with planning
                        'shortTerm': 25,  # Most achievable
                        'houseCar': -5,   # Expensive, needs careful planning
                        'business': -10,  # High risk, variable feasibility
                        'childrenEducation': 10,  # Important, plannable
                        'travelLifestyle': 5,     # Depends on lifestyle
                        'longTerm': 20    # Long horizon makes it more feasible
                    }

                    base_score += category_adjustments.get(category, 0)

                    # Adjust based on detail level (more detail = more realistic)
                    avg_detail_length = sum(len(goal) for goal in goal_list) / len(goal_list)
                    if avg_detail_length > 100:
                        base_score += 20
                    elif avg_detail_length > 50:
                        base_score += 10

                    scores[category] = max(0, min(100, base_score))
        else:
            # Fallback scoring when no dataset
            for category, goal_list in goals.items():
                if goal_list:
                    base_score = 60  # Default moderate feasibility

                    # Simple adjustments based on category
                    category_adjustments = {
                        'retirement': 10,
                        'shortTerm': 20,
                        'houseCar': -10,
                        'business': -15,
                        'childrenEducation': 5,
                        'travelLifestyle': 0,
                        'longTerm': 15
                    }

                    base_score += category_adjustments.get(category, 0)
                    scores[category] = max(0, min(100, base_score))

    except Exception as e:
        logger.warning(f"Error calculating feasibility scores: {e}")
        # Simple fallback
        for category, goal_list in goals.items():
            if goal_list:
                scores[category] = 65  # Default score

    return scores

def generate_goal_recommendations(goals: dict, priorities: dict, feasibility_scores: dict) -> List[dict]:
    """Generate personalized goal-based recommendations"""
    recommendations = []

    # High priority, high feasibility goals
    for category, priority in priorities.items():
        if priority['normalizedScore'] > 60 and feasibility_scores.get(category, 0) > 70:
            recommendations.append({
                'type': 'high_priority_feasible',
                'category': category,
                'title': f"Focus on {category.replace('_', ' ').title()}",
                'message': f"Your {category} goals are both important and highly feasible. Prioritize these for maximum impact.",
                'action': 'Start planning and allocating resources immediately',
                'priority': 'high'
            })

    # Low feasibility but high priority goals
    for category, priority in priorities.items():
        if priority['normalizedScore'] > 60 and feasibility_scores.get(category, 0) < 50:
            recommendations.append({
                'type': 'review_adjust',
                'category': category,
                'title': f"Review {category.replace('_', ' ').title()} Goals",
                'message': f"Your {category} goals are important but may need adjustment for better feasibility.",
                'action': 'Consider adjusting timeline, budget, or scope',
                'priority': 'medium'
            })

    # Many goals - focus recommendation
    if len(goals) > 5:
        recommendations.append({
            'type': 'focus_management',
            'category': 'general',
            'title': 'Goal Focus Strategy',
            'message': 'You have many goals which is great, but consider focusing on 2-3 highest priority goals first.',
            'action': 'Create a goal hierarchy and tackle one goal at a time',
            'priority': 'medium'
        })

    # Emergency fund recommendation
    if not any('emergency' in str(goals).lower() for goals_list in goals.values()):
        recommendations.append({
            'type': 'missing_emergency_fund',
            'category': 'emergency',
            'title': 'Consider Emergency Fund',
            'message': 'An emergency fund should be your highest priority goal for financial security.',
            'action': 'Start building 3-6 months of expenses as an emergency fund',
            'priority': 'high'
        })

    # Sort recommendations by priority
    priority_order = {'high': 3, 'medium': 2, 'low': 1}
    recommendations.sort(key=lambda x: priority_order.get(x.get('priority', 'medium'), 2), reverse=True)

    return recommendations

def generate_goal_investment_allocation(priorities: dict, timeline_analysis: dict) -> dict:
    """Generate investment allocation recommendations based on goals"""
    allocation = {
        'emergencyFund': 0,
        'shortTerm': 0,
        'mediumTerm': 0,
        'longTerm': 0
    }

    # Calculate total goals in each timeline
    total_immediate = len(timeline_analysis.get('immediate', []))
    total_short = len(timeline_analysis.get('shortTerm', []))
    total_medium = len(timeline_analysis.get('mediumTerm', []))
    total_long = len(timeline_analysis.get('longTerm', []))

    total_goals = total_immediate + total_short + total_medium + total_long

    if total_goals > 0:
        # Allocate based on timeline distribution and priorities
        allocation['emergencyFund'] = max(20, int((total_immediate / total_goals) * 40))
        allocation['shortTerm'] = max(15, int((total_short / total_goals) * 30))
        allocation['mediumTerm'] = max(10, int((total_medium / total_goals) * 20))
        allocation['longTerm'] = max(10, int((total_long / total_goals) * 10))

    # Ensure total adds up to 100%
    total_allocation = sum(allocation.values())
    if total_allocation != 100:
        # Adjust longTerm to balance
        allocation['longTerm'] += (100 - total_allocation)

    return allocation

def calculate_goal_confidence_score(goals: dict, feasibility_scores: dict) -> float:
    """Calculate confidence score for goal analysis"""
    if not goals:
        return 0.0

    # Base confidence
    confidence = 0.8

    # More goals = lower confidence (complexity)
    if len(goals) > 6:
        confidence *= 0.85
    elif len(goals) > 4:
        confidence *= 0.9

    # Average feasibility score affects confidence
    if feasibility_scores:
        avg_feasibility = sum(feasibility_scores.values()) / len(feasibility_scores)
        if avg_feasibility < 40:
            confidence *= 0.8
        elif avg_feasibility > 80:
            confidence *= 1.1

    return min(1.0, confidence)

# Load models on startup
@app.on_event("startup")
async def startup_event():
    """Load all ML models on application startup"""
    try:
        # Load existing models
        from ml_training import DebtManagementMLTrainer
        trainer = DebtManagementMLTrainer("synthetic_planora_dataset.csv")
        trainer.load_and_preprocess_data()

        # Load debt/investment models
        models_dir = os.path.join(os.path.dirname(__file__), "models")

        # Load existing models
        model_files = {
            'risk_model': 'risk_model.joblib',
            'debt_capacity_model': 'debt_capacity_model.joblib',
            'financial_health_model': 'financial_health_model.joblib',
            'clustering_model': 'clustering_model.joblib',
            'scaler': 'scaler.joblib'
        }

        for model_name, file_name in model_files.items():
            file_path = os.path.join(models_dir, file_name)
            if os.path.exists(file_path):
                models[model_name] = joblib.load(file_path)

        # Load label encoders and scalers
        if os.path.exists(os.path.join(models_dir, 'label_encoders.joblib')):
            models['label_encoders'] = joblib.load(os.path.join(models_dir, 'label_encoders.joblib'))
        if os.path.exists(os.path.join(models_dir, 'scaler.joblib')):
            scaler = joblib.load(os.path.join(models_dir, 'scaler.joblib'))

        # Load investment models
        investment_files = [
            'investment_rf_model.joblib', 'investment_xgb_model.joblib',
            'investment_knn_model.joblib', 'investment_kmeans_model.joblib',
            'investment_scaler.joblib', 'investment_label_encoders.joblib'
        ]

        for file_name in investment_files:
            file_path = os.path.join(models_dir, file_name)
            if os.path.exists(file_path):
                model_name = file_name.replace('.joblib', '')
                models[model_name] = joblib.load(file_path)

        # Load goal-based planning models
        load_goal_models()

        logger.info("All ML models loaded successfully")

    except Exception as e:
        logger.error(f"Error loading models: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
