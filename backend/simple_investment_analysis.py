import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from joblib import dump, load
import os

def analyze_investment_profile(user_data):
    """Analyze user investment profile using simple rules"""
    try:
        # Simple analysis based on risk appetite
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
        
        # Generate recommendations based on portfolio type
        recommendations = generate_portfolio_recommendations(portfolio_type, cluster, user_data)
        
        # Generate portfolio allocation
        portfolio_allocation = generate_portfolio_allocation(portfolio_type)
        
        response = {
            'investor_cluster': cluster,
            'portfolio_type': portfolio_type,
            'confidence': 0.8,
            'risk_profile_description': get_risk_profile_description(cluster),
            'investment_style_description': get_investment_style_description(portfolio_type),
            'time_horizon_analysis': get_time_horizon_analysis(user_data.get('investment_timeframe', 'Medium-term (1-3 years)')),
            'recommendations': recommendations,
            'portfolio_allocation': portfolio_allocation
        }
        
        return response
        
    except Exception as e:
        print(f"Error analyzing investment profile: {e}")
        return get_fallback_analysis(user_data)

def generate_portfolio_recommendations(portfolio_type, cluster, user_data):
    """Generate personalized investment recommendations"""
    if portfolio_type == 'Conservative':
        return [
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
        return [
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
        return [
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
        return [
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
