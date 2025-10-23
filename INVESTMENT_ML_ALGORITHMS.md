# Investment Guidance - ML Algorithms Documentation

## Overview
The Investment Guidance module uses **Machine Learning** to provide personalized investment recommendations based on user risk profiles, investment knowledge, and financial goals.

---

## ML Algorithms Used

### 1. **K-Means Clustering** (Unsupervised Learning)
**Purpose**: Investor Segmentation & Profiling

**Algorithm Details**:
- **Library**: `sklearn.cluster.KMeans`
- **Number of Clusters**: 4
- **Random State**: 42 (for reproducibility)

**What it does**:
- Groups investors into 4 distinct clusters based on their investment behavior patterns
- Identifies similar investor profiles for personalized recommendations

**Investor Clusters**:
1. **Cluster 0**: Conservative Investor
   - Prefers safety over returns
   - Focuses on capital preservation
   
2. **Cluster 1**: Moderate Investor
   - Balances risk and return
   - Seeks steady growth
   
3. **Cluster 2**: Growth Investor
   - Willing to take calculated risks
   - Targets higher returns
   
4. **Cluster 3**: Aggressive Investor
   - High risk tolerance
   - Seeks maximum returns

**Input Features** (10 features):
- Risk Appetite (encoded: Low=1, Moderate=2, High=3)
- Understanding Level (encoded: Low=1, Medium=2, High=3)
- Investment Preference (Short-Term=1, Long-Term=2, Both=3)
- Advisor Type (Self=1, Professional=2, Both=3)
- Past Loss Experience (No=0, Yes=1)
- Reaction to Loss (N/A=0, Panic Sell=1, Hold=2, Invest More=3)
- Review Frequency (Rarely=1, Quarterly=2, Monthly=3, Weekly=4, Yearly=5)
- Currently Investing (No=0, Yes=1)
- Investment Percentage (numeric)
- Expected Returns (Low=1, Medium=2, High=3)

---

### 2. **Random Forest Classifier** (Supervised Learning)
**Purpose**: Portfolio Type Recommendation

**Algorithm Details**:
- **Library**: `sklearn.ensemble.RandomForestClassifier`
- **Number of Trees**: 100 (n_estimators=100)
- **Random State**: 42 (for reproducibility)

**What it does**:
- Predicts the most suitable portfolio type for a user
- Provides confidence scores for recommendations
- Uses ensemble learning (multiple decision trees) for robust predictions

**Portfolio Types** (5 categories):
1. **Conservative**
   - Fixed Deposits (40%)
   - Government Bonds (30%)
   - Blue Chip Stocks (20%)
   - Gold (10%)

2. **Balanced**
   - Equity Mutual Funds (40%)
   - Blue Chip Stocks (30%)
   - Fixed Deposits (20%)
   - Gold (10%)

3. **Aggressive**
   - Direct Equity (50%)
   - Aggressive Equity Funds (30%)
   - Small Cap Funds (15%)
   - Crypto/Alternative Investments (5%)

4. **Beginner**
   - SIP in Balanced Funds (50%)
   - Fixed Deposits (30%)
   - Debt Mutual Funds (15%)
   - Emergency Fund (5%)

5. **Moderate**
   - SIP in Balanced Funds (50%)
   - Fixed Deposits (30%)
   - Debt Mutual Funds (15%)
   - Emergency Fund (5%)

**Training Process**:
- Train-Test Split: 80% training, 20% testing
- Feature Scaling: StandardScaler (mean=0, std=1)
- Evaluation Metric: Accuracy Score

---

### 3. **StandardScaler** (Feature Preprocessing)
**Purpose**: Feature Normalization

**Algorithm Details**:
- **Library**: `sklearn.preprocessing.StandardScaler`
- **Method**: Z-score normalization

**What it does**:
- Standardizes features by removing the mean and scaling to unit variance
- Formula: `z = (x - μ) / σ`
  - `x` = original value
  - `μ` = mean
  - `σ` = standard deviation
- Ensures all features contribute equally to the model
- Improves convergence and performance of ML algorithms

---

### 4. **LabelEncoder** (Categorical Encoding)
**Purpose**: Convert categorical variables to numerical format

**Algorithm Details**:
- **Library**: `sklearn.preprocessing.LabelEncoder`

**What it does**:
- Transforms categorical features into numerical labels
- Used for features like Risk Appetite, Understanding Level, Preference, Advisor Type

---

## ML Pipeline Flow

```
User Input (Questionnaire)
        ↓
Feature Extraction & Encoding
        ↓
StandardScaler (Normalization)
        ↓
    ┌───────────────────────┐
    │                       │
    ↓                       ↓
K-Means Clustering    Random Forest
(Investor Profile)    (Portfolio Type)
    │                       │
    └───────────────────────┘
                ↓
    Generate Recommendations
                ↓
    Return Analysis Results
```

---

## Model Files

All trained models are saved in `backend/models/`:

1. **investment_kmeans_model.joblib** - K-Means clustering model
2. **investment_rf_model.joblib** - Random Forest classifier
3. **investment_scaler.joblib** - StandardScaler for feature normalization
4. **investment_label_encoders.joblib** - Label encoders for categorical features
5. **investment_feature_mappings.joblib** - Feature mapping dictionaries

---

## API Endpoint

**Endpoint**: `POST /analyze-investment-profile`

**Request Body**:
```json
{
  "risk_appetite": "Moderate (Balance between safety and returns)",
  "investment_timeframe": "Medium-term (1-3 years)",
  "monthly_investment": 10000,
  "experience_level": 2,
  "loss_tolerance": 1,
  "current_investments": ["Mutual Funds", "Fixed Deposits"],
  "expected_returns": 2,
  "management_style": "Both"
}
```

**Response**:
```json
{
  "investor_cluster": 1,
  "portfolio_type": "Balanced",
  "confidence": 0.85,
  "risk_profile_description": "Moderate Investor - Balances risk and return, seeks steady growth",
  "investment_style_description": "Balanced approach between growth and stability",
  "time_horizon_analysis": "Medium-term investments balance growth and stability...",
  "recommendations": [
    {
      "title": "Equity Mutual Funds (40%)",
      "description": "Balanced mix of equity and debt for moderate growth.",
      "allocation": 40
    }
  ],
  "portfolio_allocation": [
    {
      "instrument": "Equity Mutual Funds",
      "percentage": 40,
      "rationale": "Balanced mix of equity and debt"
    }
  ]
}
```

---

## Current Implementation Status

✅ **Active Features**:
- Rule-based investment analysis (fallback system)
- Simple risk profiling based on user inputs
- Portfolio recommendations (Conservative, Balanced, Aggressive)
- Frontend questionnaire with 9 questions
- Backend API endpoint `/analyze-investment-profile`
- Integration with React frontend

⚠️ **ML Models Status**:
- ML training code is available in `investment_ml_training.py`
- Models need to be trained with actual investment dataset
- Dataset required: `investment_dataset_2000.csv`
- Currently using rule-based fallback in `simple_investment_analysis.py`

---

## Training the ML Models

To train the investment ML models:

```bash
# Navigate to backend directory
cd backend

# Run the training script
python investment_ml_training.py
```

**Requirements**:
- Investment dataset: `investment_dataset_2000.csv`
- Python packages: scikit-learn, pandas, numpy, joblib

---

## Advantages of ML Approach

1. **Personalization**: Tailored recommendations based on individual profiles
2. **Pattern Recognition**: Identifies complex relationships in investor behavior
3. **Scalability**: Can handle large datasets and improve with more data
4. **Confidence Scores**: Provides transparency in recommendation quality
5. **Clustering**: Groups similar investors for better insights
6. **Ensemble Learning**: Random Forest reduces overfitting and improves accuracy

---

## Future Enhancements

1. **Deep Learning**: Neural networks for more complex pattern recognition
2. **Time Series Analysis**: Predict market trends and optimal investment timing
3. **Reinforcement Learning**: Adaptive portfolio rebalancing
4. **NLP Integration**: Analyze financial news and sentiment
5. **Real-time Data**: Integration with live market data APIs
6. **Explainable AI**: SHAP/LIME for model interpretability

---

## References

- **Scikit-learn Documentation**: https://scikit-learn.org/
- **K-Means Clustering**: https://scikit-learn.org/stable/modules/clustering.html#k-means
- **Random Forest**: https://scikit-learn.org/stable/modules/ensemble.html#forest
