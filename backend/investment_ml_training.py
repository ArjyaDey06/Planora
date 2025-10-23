import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def prepare_investment_dataset():
    """Load and prepare the investment dataset for ML training"""
    try:
        # Load the dataset
        df = pd.read_csv('investment_dataset_2000.csv')
        print(f"Loaded dataset with {len(df)} records")
        
        # Display basic info about the dataset
        print("\nDataset columns:", df.columns.tolist())
        print("\nFirst few rows:")
        print(df.head())
        
        # Create feature mappings
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
        
        # Create numerical features for ML
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
        
        print(f"\nFeatures shape: {X.shape}")
        print(f"Target shape: {y.shape}")
        print(f"Target distribution:\n{y.value_counts()}")
        
        return X, y, df_clean, feature_mappings
        
    except Exception as e:
        print(f"Error preparing dataset: {e}")
        return None, None, None, None

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

def train_investment_models():
    """Train ML models for investment analysis"""
    try:
        X, y, df_clean, feature_mappings = prepare_investment_dataset()
        
        if X is None:
            print("Failed to prepare dataset")
            return False
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train KMeans for investor clustering
        kmeans = KMeans(n_clusters=4, random_state=42)
        clusters = kmeans.fit_predict(X_train_scaled)
        
        # Create a mapping for the full dataset
        df_clean['Investor_Cluster'] = 0  # Default cluster
        train_indices = X_train.index
        df_clean.loc[train_indices, 'Investor_Cluster'] = clusters
        
        # Train Random Forest for portfolio recommendation
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X_train_scaled, y_train)
        
        # Evaluate models
        y_pred = rf.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"\nPortfolio Recommendation Accuracy: {accuracy:.3f}")
        
        # Create label encoders for categorical features
        label_encoders = {}
        for feature in ['Risk_Appetite', 'Understanding_Level', 'Preference', 'Advisor_Type']:
            if feature in df_clean.columns:
                le = LabelEncoder()
                le.fit(df_clean[feature])
                label_encoders[feature] = le
        
        # Save models
        os.makedirs('models', exist_ok=True)
        
        joblib.dump(kmeans, 'models/investment_kmeans_model.joblib')
        joblib.dump(rf, 'models/investment_rf_model.joblib')
        joblib.dump(scaler, 'models/investment_scaler.joblib')
        joblib.dump(label_encoders, 'models/investment_label_encoders.joblib')
        joblib.dump(feature_mappings, 'models/investment_feature_mappings.joblib')
        
        print("\nModels saved successfully!")
        return True
        
    except Exception as e:
        print(f"Error training models: {e}")
        return False

def analyze_user_profile(user_data, models_dir='models'):
    """Analyze user investment profile using trained models"""
    try:
        # Load models
        kmeans = joblib.load(f'{models_dir}/investment_kmeans_model.joblib')
        rf = joblib.load(f'{models_dir}/investment_rf_model.joblib')
        scaler = joblib.load(f'{models_dir}/investment_scaler.joblib')
        feature_mappings = joblib.load(f'{models_dir}/investment_feature_mappings.joblib')
        
        # Map user data to features
        features = np.array([[
            feature_mappings['Risk_Appetite'].get(user_data.get('risk_appetite', 'Moderate'), 2),
            feature_mappings['Understanding_Level'].get(user_data.get('understanding_level', 'Medium'), 2),
            feature_mappings['Preference'].get(user_data.get('preference', 'Both'), 3),
            feature_mappings['Advisor_Type'].get(user_data.get('advisor_type', 'Professional Advisor'), 2),
            feature_mappings['Past_Loss_Experience'].get(user_data.get('past_loss_experience', 'No'), 0),
            feature_mappings['Reaction_To_Loss'].get(user_data.get('reaction_to_loss', 'Hold'), 2),
            feature_mappings['Review_Frequency'].get(user_data.get('review_frequency', 'Monthly'), 3),
            feature_mappings['Currently_Investing'].get(user_data.get('currently_investing', 'Yes'), 1),
            float(user_data.get('investment_percentage', 10)),
            int(user_data.get('expected_returns', 2))
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Get predictions
        cluster = kmeans.predict(features_scaled)[0]
        portfolio_type = rf.predict(features_scaled)[0]
        portfolio_probabilities = rf.predict_proba(features_scaled)[0]
        
        # Generate recommendations based on portfolio type
        recommendations = generate_portfolio_recommendations(portfolio_type, cluster, user_data)
        
        return {
            'investor_cluster': int(cluster),
            'portfolio_type': portfolio_type,
            'confidence': float(np.max(portfolio_probabilities)),
            'recommendations': recommendations,
            'risk_profile': get_risk_profile_description(cluster),
            'investment_style': get_investment_style_description(portfolio_type)
        }
        
    except Exception as e:
        print(f"Error analyzing user profile: {e}")
        return None

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

if __name__ == "__main__":
    print("Training investment ML models...")
    success = train_investment_models()
    if success:
        print("Training completed successfully!")
    else:
        print("Training failed!")
