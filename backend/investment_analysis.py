import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from joblib import dump, load
import os

def prepare_investment_data():
    """Prepare investment data using the actual dataset structure"""
    try:
    # Load the dataset
    df = pd.read_csv('investment_dataset_2000.csv')
        print(f"Loaded dataset with {len(df)} records")
        
        # Create feature mappings based on actual dataset columns
        feature_mappings = {
            'Risk_Appetite': {'Low': 1, 'Moderate': 2, 'High': 3},
            'Understanding_Level': {'Low': 1, 'Medium': 2, 'High': 3},
            'Preference': {'Short-Term': 1, 'Long-Term': 2, 'Both': 3},
            'Advisor_Type': {'Self': 1, 'Professional Advisor': 2, 'Both': 3},
            'Past_Loss_Experience': {'No': 0, 'Yes': 1},
            'Reaction_To_Loss': {'N/A': 0, 'Panic Sell': 1, 'Hold': 2, 'Invest More': 3},
            'Review_Frequency': {'Rarely': 1, 'Quarterly': 2, 'Monthly': 3, 'Weekly': 4, 'Yearly': 5},
            'Currently_Investing': {'No': 0, 'Yes': 1}
        }
        
        # Apply mappings
        for column, mapping in feature_mappings.items():
            if column in df.columns:
                df[column + '_encoded'] = df[column].map(mapping)
        
        # Create numerical features
        df['Investment_%_numeric'] = df['Income_Investment_%'].astype(float)
        df['Return_Expectation_encoded'] = df['Return_Expectation'].map({
            'Low (<8%)': 1,
            'Medium (8-12%)': 2,
            'High (>12%)': 3
        })
        
        # Create target variable for portfolio recommendation
        df['Portfolio_Type'] = df['Recommended_Investment'].apply(categorize_portfolio)
        
        # Select features for ML
    features = [
            'Risk_Appetite_encoded',
            'Understanding_Level_encoded', 
            'Preference_encoded',
            'Advisor_Type_encoded',
            'Past_Loss_Experience_encoded',
            'Reaction_To_Loss_encoded',
            'Review_Frequency_encoded',
            'Currently_Investing_encoded',
            'Investment_%_numeric',
            'Return_Expectation_encoded'
        ]
        
        # Remove rows with missing values
        df_clean = df.dropna(subset=features + ['Portfolio_Type'])
        
        X = df_clean[features]
        y = df_clean['Portfolio_Type']
        
        # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
        # Train KMeans for investor clustering
    kmeans = KMeans(n_clusters=4, random_state=42)
        df_clean['Investor_Cluster'] = kmeans.fit_predict(X_scaled)
    
    # Train Random Forest for portfolio recommendation
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X_scaled, y)
        
        # Create label encoders for categorical features
        label_encoders = {}
        for feature in ['Risk_Appetite', 'Understanding_Level', 'Preference', 'Advisor_Type']:
            if feature in df_clean.columns:
                le = LabelEncoder()
                le.fit(df_clean[feature])
                label_encoders[feature] = le
    
    # Save the models
        os.makedirs('models', exist_ok=True)
        
        dump(kmeans, 'models/investment_kmeans_model.joblib')
        dump(rf, 'models/investment_rf_model.joblib')
    dump(scaler, 'models/investment_scaler.joblib')
        dump(label_encoders, 'models/investment_label_encoders.joblib')
        dump(feature_mappings, 'models/investment_feature_mappings.joblib')
        
        print("Investment models prepared and saved successfully!")
        return True
        
    except Exception as e:
        print(f"Error preparing investment data: {e}")
        return False

def categorize_portfolio(recommendation):
    """Categorize portfolio recommendations into types"""
    if pd.isna(recommendation):
        return 'Conservative'
    
    rec = str(recommendation).lower()
    
    if 'fd' in rec and 'debt' in rec and 'gold' in rec:
        return 'Conservative'
    elif 'sip' in rec and 'equity' in rec and 'debt' in rec:
        return 'Balanced'
    elif 'equity' in rec and 'aggressive' in rec:
        return 'Aggressive'
    elif 'start' in rec and 'fd' in rec:
        return 'Beginner'
    else:
        return 'Moderate'

def analyze_investment_profile(user_data):
    """Analyze user investment profile using trained ML models"""
    try:
        # Load models if they exist
        models_dir = 'models'
        if not os.path.exists(f'{models_dir}/investment_rf_model.joblib'):
            # If models don't exist, train them first
            print("Models not found. Training models...")
            prepare_investment_data()
        
        # Load models
        kmeans = load(f'{models_dir}/investment_kmeans_model.joblib')
        rf = load(f'{models_dir}/investment_rf_model.joblib')
        scaler = load(f'{models_dir}/investment_scaler.joblib')
        feature_mappings = load(f'{models_dir}/investment_feature_mappings.joblib')
        
        # Map user data to match dataset features
        risk_appetite_map = {
            'Low (Prefer safety over returns)': 'Low',
            'Moderate (Balance between safety and returns)': 'Moderate',
            'High (Can take risks for higher returns)': 'High'
        }
        
        understanding_map = {
            'Very well - I research thoroughly': 'High',
            'Moderately - I understand the basics': 'Medium',
            'Limited - I rely on advice': 'Low',
            'Not much - Need to learn more': 'Low'
        }
        
        preference_map = {
            'Short-term (Less than 1 year)': 'Short-Term',
            'Medium-term (1-3 years)': 'Both',
            'Long-term (More than 3 years)': 'Long-Term',
            'Mix of timeframes': 'Both'
        }
        
        advisor_map = {
            'Through a financial advisor': 'Professional Advisor',
            'Self-managed': 'Self',
            'Both': 'Both'
        }
        
        loss_reaction_map = {
            'Withdraw immediately': 'Panic Sell',
            'Wait and watch': 'Hold',
            'See it as an opportunity': 'Invest More',
            'Seek professional advice': 'Hold'
        }
        
        # Prepare user features
        features = np.array([[
            feature_mappings['Risk_Appetite'].get(risk_appetite_map.get(user_data.get('risk_appetite', 'Moderate (Balance between safety and returns)'), 'Moderate'), 2),
            feature_mappings['Understanding_Level'].get(understanding_map.get(user_data.get('experience_level', 'Moderately - I understand the basics'), 'Medium'), 2),
            feature_mappings['Preference'].get(preference_map.get(user_data.get('investment_timeframe', 'Medium-term (1-3 years)'), 'Both'), 3),
            feature_mappings['Advisor_Type'].get(advisor_map.get(user_data.get('management_style', 'Through a financial advisor'), 'Professional Advisor'), 2),
            feature_mappings['Past_Loss_Experience'].get('No', 0),  # Default to no past loss experience
            feature_mappings['Reaction_To_Loss'].get(loss_reaction_map.get(user_data.get('loss_tolerance', 'Wait and watch'), 'Hold'), 2),
            feature_mappings['Review_Frequency'].get('Monthly', 3),  # Default to monthly
            feature_mappings['Currently_Investing'].get('Yes', 1),  # Default to currently investing
            float(user_data.get('monthly_investment', 0)) / 1000,  # Convert to thousands for scaling
            int(user_data.get('expected_returns', 2))  # Default to moderate returns
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Get predictions
        cluster = kmeans.predict(features_scaled)[0]
        portfolio_type = rf.predict(features_scaled)[0]
        portfolio_probabilities = rf.predict_proba(features_scaled)[0]
        
        # Generate recommendations based on portfolio type
        recommendations = generate_portfolio_recommendations(portfolio_type, cluster, user_data)
        
        # Generate portfolio allocation
        portfolio_allocation = generate_portfolio_allocation(portfolio_type)
        
        response = {
            'investor_cluster': int(cluster),
            'portfolio_type': portfolio_type,
            'confidence': float(np.max(portfolio_probabilities)),
            'risk_profile_description': get_risk_profile_description(cluster),
            'investment_style_description': get_investment_style_description(portfolio_type),
            'time_horizon_analysis': get_time_horizon_analysis(user_data.get('investment_timeframe', 'Medium-term (1-3 years)')),
            'recommendations': recommendations,
            'portfolio_allocation': portfolio_allocation
        }
        
        return response
        
    except Exception as e:
        print(f"Error analyzing investment profile: {e}")
        # Return fallback analysis
        return get_fallback_analysis(user_data)

def generate_portfolio_recommendations(portfolio_type, cluster, user_data):
    """Generate personalized investment recommendations"""
    recommendations = []
    
    if portfolio_type == 'Conservative':
        recommendations = [
            {
                'title': 'Fixed Deposits (40%)',
                'description': 'Stable returns with minimal risk. Perfect for capital preservation.',
                'allocation': 40
            },
            {
                'title': 'Government Bonds (30%)',
                'description': 'Safe investment with steady returns and government backing.',
                'allocation': 30
            },
            {
                'title': 'Blue Chip Stocks (20%)',
                'description': 'Stable companies with good dividend history and lower volatility.',
                'allocation': 20
            },
            {
                'title': 'Gold (10%)',
                'description': 'Hedge against market volatility and inflation protection.',
                'allocation': 10
            }
        ]
    elif portfolio_type == 'Balanced':
        recommendations = [
            {
                'title': 'Equity Mutual Funds (40%)',
                'description': 'Balanced mix of equity and debt for moderate growth.',
                'allocation': 40
            },
            {
                'title': 'Blue Chip Stocks (30%)',
                'description': 'Stable growth potential with established companies.',
                'allocation': 30
            },
            {
                'title': 'Fixed Deposits (20%)',
                'description': 'Safety net component for stability.',
                'allocation': 20
            },
            {
                'title': 'Gold (10%)',
                'description': 'Market hedge and diversification.',
                'allocation': 10
            }
        ]
    elif portfolio_type == 'Aggressive':
        recommendations = [
            {
                'title': 'Direct Equity (50%)',
                'description': 'High growth potential with individual stock selection.',
                'allocation': 50
            },
            {
                'title': 'Aggressive Equity Funds (30%)',
                'description': 'High-risk, high-return mutual funds.',
                'allocation': 30
            },
            {
                'title': 'Small Cap Funds (15%)',
                'description': 'Higher volatility but potential for significant growth.',
                'allocation': 15
            },
            {
                'title': 'Crypto/Alternative Investments (5%)',
                'description': 'High-risk alternative investments for diversification.',
                'allocation': 5
            }
        ]
    else:  # Beginner or Moderate
        recommendations = [
            {
                'title': 'SIP in Balanced Funds (50%)',
                'description': 'Systematic investment in balanced mutual funds.',
                'allocation': 50
            },
            {
                'title': 'Fixed Deposits (30%)',
                'description': 'Safe investment for capital preservation.',
                'allocation': 30
            },
            {
                'title': 'Debt Mutual Funds (15%)',
                'description': 'Stable returns with better liquidity than FDs.',
                'allocation': 15
            },
            {
                'title': 'Emergency Fund (5%)',
                'description': 'Liquid funds for emergency situations.',
                'allocation': 5
            }
        ]
    
    return recommendations

def generate_portfolio_allocation(portfolio_type):
    """Generate portfolio allocation based on portfolio type"""
    allocations = {
        "Conservative": [
            {"instrument": "Fixed Deposits", "percentage": 40, "rationale": "Stable returns with minimal risk"},
            {"instrument": "Government Bonds", "percentage": 30, "rationale": "Safe investment with steady returns"},
            {"instrument": "Blue Chip Stocks", "percentage": 20, "rationale": "Stable companies with good dividend history"},
            {"instrument": "Gold", "percentage": 10, "rationale": "Hedge against market volatility"}
        ],
        "Balanced": [
            {"instrument": "Equity Mutual Funds", "percentage": 40, "rationale": "Balanced mix of equity and debt"},
            {"instrument": "Blue Chip Stocks", "percentage": 30, "rationale": "Stable growth potential"},
            {"instrument": "Fixed Deposits", "percentage": 20, "rationale": "Safety net component"},
            {"instrument": "Gold", "percentage": 10, "rationale": "Market hedge"}
        ],
        "Aggressive": [
            {"instrument": "Direct Equity", "percentage": 50, "rationale": "High growth potential with individual stock selection"},
            {"instrument": "Aggressive Equity Funds", "percentage": 30, "rationale": "High-risk, high-return mutual funds"},
            {"instrument": "Small Cap Funds", "percentage": 15, "rationale": "Higher volatility but potential for significant growth"},
            {"instrument": "Crypto/Alternative Investments", "percentage": 5, "rationale": "High-risk alternative investments for diversification"}
        ],
        "Beginner": [
            {"instrument": "SIP in Balanced Funds", "percentage": 50, "rationale": "Systematic investment in balanced mutual funds"},
            {"instrument": "Fixed Deposits", "percentage": 30, "rationale": "Safe investment for capital preservation"},
            {"instrument": "Debt Mutual Funds", "percentage": 15, "rationale": "Stable returns with better liquidity than FDs"},
            {"instrument": "Emergency Fund", "percentage": 5, "rationale": "Liquid funds for emergency situations"}
        ],
        "Moderate": [
            {"instrument": "SIP in Balanced Funds", "percentage": 50, "rationale": "Systematic investment in balanced mutual funds"},
            {"instrument": "Fixed Deposits", "percentage": 30, "rationale": "Safe investment for capital preservation"},
            {"instrument": "Debt Mutual Funds", "percentage": 15, "rationale": "Stable returns with better liquidity than FDs"},
            {"instrument": "Emergency Fund", "percentage": 5, "rationale": "Liquid funds for emergency situations"}
        ]
    }
    
    return allocations.get(portfolio_type, allocations["Moderate"])

def get_risk_profile_description(cluster):
    """Get risk profile description based on cluster"""
    profiles = {
        0: "Conservative Investor - Prefers safety over returns, focuses on capital preservation",
        1: "Moderate Investor - Balances risk and return, seeks steady growth",
        2: "Growth Investor - Willing to take calculated risks for higher returns",
        3: "Aggressive Investor - High risk tolerance, seeks maximum returns"
    }
    return profiles.get(cluster, "Moderate Investor")

def get_investment_style_description(portfolio_type):
    """Get investment style description based on portfolio type"""
    styles = {
        'Conservative': "Capital preservation focused with minimal risk exposure",
        'Balanced': "Balanced approach between growth and stability",
        'Aggressive': "Growth focused with high risk tolerance",
        'Beginner': "Simple, easy-to-understand investment approach",
        'Moderate': "Moderate risk approach with steady growth focus"
    }
    return styles.get(portfolio_type, "Balanced approach")

def get_time_horizon_analysis(timeframe):
    """Get time horizon analysis based on investment timeframe"""
    analyses = {
        'Short-term (Less than 1 year)': "Short-term investments focus on liquidity and capital preservation. Consider money market funds, short-term FDs, and liquid mutual funds.",
        'Medium-term (1-3 years)': "Medium-term investments balance growth and stability. Consider balanced mutual funds, corporate bonds, and hybrid funds.",
        'Long-term (More than 3 years)': "Long-term investments can focus on growth. Consider equity mutual funds, SIPs, and diversified equity portfolios.",
        'Mix of timeframes': "Diversified approach across different time horizons. Allocate based on specific goals and risk tolerance."
    }
    return analyses.get(timeframe, "Medium-term investment approach recommended for balanced growth and stability.")

def get_fallback_analysis(user_data):
    """Fallback analysis when ML models are not available"""
    risk_appetite = user_data.get('risk_appetite', 'Moderate (Balance between safety and returns)')
    
    if 'Low' in risk_appetite:
        portfolio_type = 'Conservative'
        cluster = 0
    elif 'High' in risk_appetite:
        portfolio_type = 'Aggressive'
        cluster = 3
    else:
        portfolio_type = 'Balanced'
        cluster = 1
    
    return {
        'investor_cluster': cluster,
        'portfolio_type': portfolio_type,
        'confidence': 0.7,
        'risk_profile_description': get_risk_profile_description(cluster),
        'investment_style_description': get_investment_style_description(portfolio_type),
        'time_horizon_analysis': get_time_horizon_analysis(user_data.get('investment_timeframe', 'Medium-term (1-3 years)')),
        'recommendations': generate_portfolio_recommendations(portfolio_type, cluster, user_data),
        'portfolio_allocation': generate_portfolio_allocation(portfolio_type)
    }