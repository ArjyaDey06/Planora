#!/usr/bin/env python3
"""
Planora Goal-Based Planning ML Training Script
This script trains machine learning models specifically for goal-based financial planning analysis.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, mean_squared_error, r2_score, silhouette_score
from sklearn.feature_extraction.text import TfidfVectorizer
import xgboost as xgb
import joblib
import os
import logging
from typing import Dict, Any, Tuple, List
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoalBasedPlanningMLTrainer:
    """ML Training class for goal-based planning models"""

    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        self.dataset = None
        self.models = {}
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.tfidf_vectorizers = {}
        self.model_dir = os.path.join(os.path.dirname(__file__), "models")

        # Create models directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)

    def load_and_preprocess_data(self) -> pd.DataFrame:
        """Load and preprocess the dataset for goal-based planning"""
        logger.info("Loading dataset for goal-based planning...")

        # Load dataset
        self.dataset = pd.read_csv(self.dataset_path)
        logger.info(f"Dataset loaded with {len(self.dataset)} records and {len(self.dataset.columns)} columns")

        # Handle missing values
        self.dataset = self.dataset.fillna('None')

        # Create derived financial features
        self.dataset['debt_to_income_ratio'] = self.dataset['debt_amount'] / (self.dataset['monthly_income'] + 1)
        self.dataset['savings_to_income_ratio'] = self.dataset['savings'] / (self.dataset['monthly_income'] + 1)
        self.dataset['expense_to_income_ratio'] = self.dataset['expenses'] / (self.dataset['monthly_income'] + 1)
        self.dataset['emergency_fund_ratio'] = self.dataset['emergency_fund'] / (self.dataset['monthly_income'] + 1)

        # Process goal text data using TF-IDF
        self._process_goal_text_features()

        # Encode categorical variables
        categorical_columns = ['occupation', 'investment_type', 'risk_appetite']

        for col in categorical_columns:
            if col in self.dataset.columns:
                le = LabelEncoder()
                self.dataset[f'{col}_encoded'] = le.fit_transform(self.dataset[col].astype(str))
                self.label_encoders[col] = le

        # Create binary features
        self.dataset['has_loans_binary'] = self.dataset['has_loans'].astype(int)
        self.dataset['invests_binary'] = self.dataset['invests'].astype(int)

        logger.info("Data preprocessing completed")
        return self.dataset

    def _process_goal_text_features(self):
        """Process goal text data using TF-IDF vectorization"""
        goal_columns = ['short_term_goals', 'long_term_goals']

        for col in goal_columns:
            if col in self.dataset.columns:
                # Create TF-IDF features for goals
                tfidf = TfidfVectorizer(max_features=50, stop_words='english')
                goal_tfidf = tfidf.fit_transform(self.dataset[col].astype(str))

                # Convert to DataFrame and add to dataset
                tfidf_df = pd.DataFrame(
                    goal_tfidf.toarray(),
                    columns=[f'{col}_tfidf_{i}' for i in range(goal_tfidf.shape[1])]
                )

                self.dataset = pd.concat([self.dataset, tfidf_df], axis=1)
                self.tfidf_vectorizers[col] = tfidf

                logger.info(f"Created {goal_tfidf.shape[1]} TF-IDF features for {col}")

    def prepare_features_and_targets(self) -> Tuple[Dict[str, np.ndarray], Dict[str, np.ndarray]]:
        """Prepare feature matrices and targets for different goal-based models"""

        # Base financial features
        financial_features = [
            'age', 'monthly_income', 'expenses', 'savings', 'emergency_fund',
            'debt_amount', 'monthly_emi', 'debt_to_income_ratio', 'savings_to_income_ratio',
            'expense_to_income_ratio', 'emergency_fund_ratio', 'has_loans_binary', 'invests_binary'
        ]

        # Add encoded categorical features
        encoded_features = [col for col in self.dataset.columns if col.endswith('_encoded')]

        # Add TF-IDF features
        tfidf_features = [col for col in self.dataset.columns if col.endswith('_tfidf_0')]

        all_features = financial_features + encoded_features + tfidf_features[:10]  # Limit TF-IDF features

        # Remove features that don't exist
        available_features = [f for f in all_features if f in self.dataset.columns]

        X = self.dataset[available_features].values

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Prepare target variables for different goal predictions
        targets = {
            'goal_feasibility_score': self._create_feasibility_target(),
            'goal_priority_score': self._create_priority_target(),
            'investment_allocation_emergency': self._create_allocation_target('emergency'),
            'investment_allocation_short': self._create_allocation_target('short'),
            'investment_allocation_medium': self._create_allocation_target('medium'),
            'investment_allocation_long': self._create_allocation_target('long'),
            'goal_timeline_category': self._create_timeline_target()
        }

        logger.info(f"Prepared features: {X_scaled.shape}, Available targets: {list(targets.keys())}")
        return X_scaled, targets

    def _create_feasibility_target(self) -> np.ndarray:
        """Create feasibility score target based on financial health and savings capacity"""
        # Higher feasibility for people with good financial health and high savings rate
        feasibility = []

        for _, row in self.dataset.iterrows():
            score = 50  # Base score

            # Financial health contribution
            health_scores = {'Good': 30, 'Average': 15, 'Poor': -10}
            score += health_scores.get(row['financial_health'], 0)

            # Savings capacity contribution
            savings_rate = row['savings_to_income_ratio']
            if savings_rate > 0.2: score += 20
            elif savings_rate > 0.1: score += 10
            elif savings_rate < 0.05: score -= 10

            # Debt burden impact
            if row['debt_to_income_ratio'] > 0.5: score -= 15
            elif row['debt_to_income_ratio'] > 0.3: score -= 5

            feasibility.append(max(0, min(100, score)))

        return np.array(feasibility)

    def _create_priority_target(self) -> np.ndarray:
        """Create priority score target based on goal specificity and financial capacity"""
        priorities = []

        for _, row in self.dataset.iterrows():
            score = 50

            # More specific goals get higher priority
            short_goals = str(row['short_term_goals'])
            long_goals = str(row['long_term_goals'])

            if short_goals != 'None' and len(short_goals) > 10: score += 15
            if long_goals != 'None' and len(long_goals) > 10: score += 15

            # Financial capacity for goals
            if row['savings_to_income_ratio'] > 0.15: score += 20
            if row['financial_health'] == 'Good': score += 10

            priorities.append(max(0, min(100, score)))

        return np.array(priorities)

    def _create_allocation_target(self, category: str) -> np.ndarray:
        """Create investment allocation targets for different time horizons"""
        allocations = []

        for _, row in self.dataset.iterrows():
            base_alloc = 25  # Base 25% allocation

            # Adjust based on financial situation
            if row['financial_health'] == 'Good': base_alloc += 10
            if row['savings_to_income_ratio'] > 0.2: base_alloc += 15
            if row['debt_to_income_ratio'] < 0.2: base_alloc += 10

            # Category-specific adjustments
            if category == 'emergency':
                if row['emergency_fund_ratio'] < 0.5: base_alloc += 20
            elif category == 'long':
                if 'retirement' in str(row['long_term_goals']).lower(): base_alloc += 15
            elif category == 'short':
                if 'vacation' in str(row['short_term_goals']).lower(): base_alloc += 5

            allocations.append(max(5, min(50, base_alloc)))

        return np.array(allocations)

    def _create_timeline_target(self) -> np.ndarray:
        """Create timeline category target (0: Short-term, 1: Medium-term, 2: Long-term)"""
        timelines = []

        for _, row in self.dataset.iterrows():
            short_goals = str(row['short_term_goals'])
            long_goals = str(row['long_term_goals'])

            # Determine primary timeline focus
            if 'retirement' in long_goals.lower() or 'education' in long_goals.lower():
                timeline = 2  # Long-term
            elif 'house' in long_goals.lower() or 'business' in long_goals.lower():
                timeline = 1  # Medium-term
            elif 'vacation' in short_goals.lower() or 'car' in short_goals.lower():
                timeline = 1  # Medium-term
            else:
                timeline = 0  # Short-term

            timelines.append(timeline)

        return np.array(timelines)

    def train_goal_feasibility_model(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Train XGBoost model for goal feasibility prediction"""
        logger.info("Training goal feasibility model...")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train XGBoost model
        model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )

        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        logger.info(f"Feasibility Model - MSE: {mse:.2f}, R2: {r2:.2f}")

        return {
            'model': model,
            'mse': mse,
            'r2': r2,
            'feature_importance': model.feature_importances_
        }

    def train_goal_priority_model(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Train Random Forest model for goal priority prediction"""
        logger.info("Training goal priority model...")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        logger.info(f"Priority Model - MSE: {mse:.2f}, R2: {r2:.2f}")

        return {
            'model': model,
            'mse': mse,
            'r2': r2,
            'feature_importance': model.feature_importances_
        }

    def train_allocation_models(self, X: np.ndarray, targets: Dict[str, np.ndarray]) -> Dict[str, Dict[str, Any]]:
        """Train models for investment allocation prediction"""
        logger.info("Training investment allocation models...")

        allocation_models = {}

        for category in ['emergency', 'short', 'medium', 'long']:
            target_key = f'investment_allocation_{category}'
            if target_key in targets:
                y = targets[target_key]

                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

                model = RandomForestRegressor(n_estimators=50, max_depth=6, random_state=42)
                model.fit(X_train, y_train)

                y_pred = model.predict(X_test)
                mse = mean_squared_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)

                allocation_models[category] = {
                    'model': model,
                    'mse': mse,
                    'r2': r2
                }

                logger.info(f"{category.title()} Allocation Model - MSE: {mse:.2f}, R2: {r2:.2f}")

        return allocation_models

    def train_timeline_classifier(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Train classifier for goal timeline prediction"""
        logger.info("Training goal timeline classifier...")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        report = classification_report(y_test, y_pred, output_dict=True)

        logger.info(f"Timeline Classifier - Accuracy: {report['accuracy']:.2f}")

        return {
            'model': model,
            'accuracy': report['accuracy'],
            'report': report
        }

    def train_all_models(self) -> Dict[str, Any]:
        """Train all goal-based planning models"""
        logger.info("Starting goal-based planning model training...")

        # Load and preprocess data
        self.load_and_preprocess_data()

        # Prepare features and targets
        X, targets = self.prepare_features_and_targets()

        # Train all models
        results = {}

        # Feasibility model
        results['feasibility'] = self.train_goal_feasibility_model(X, targets['goal_feasibility_score'])

        # Priority model
        results['priority'] = self.train_goal_priority_model(X, targets['goal_priority_score'])

        # Allocation models
        results['allocation'] = self.train_allocation_models(X, targets)

        # Timeline classifier
        results['timeline'] = self.train_timeline_classifier(X, targets['goal_timeline_category'])

        # Save all models
        self.save_models(results)

        logger.info("All goal-based planning models trained successfully!")
        return results

    def save_models(self, results: Dict[str, Any]):
        """Save all trained models to disk"""
        logger.info("Saving goal-based planning models...")

        # Save main models
        joblib.dump(results['feasibility']['model'], os.path.join(self.model_dir, 'goal_feasibility_model.joblib'))
        joblib.dump(results['priority']['model'], os.path.join(self.model_dir, 'goal_priority_model.joblib'))
        joblib.dump(results['timeline']['model'], os.path.join(self.model_dir, 'goal_timeline_classifier.joblib'))

        # Save allocation models
        for category, model_data in results['allocation'].items():
            joblib.dump(model_data['model'], os.path.join(self.model_dir, f'goal_allocation_{category}_model.joblib'))

        # Save scaler and encoders
        joblib.dump(self.scaler, os.path.join(self.model_dir, 'goal_scaler.joblib'))
        joblib.dump(self.label_encoders, os.path.join(self.model_dir, 'goal_label_encoders.joblib'))
        joblib.dump(self.tfidf_vectorizers, os.path.join(self.model_dir, 'goal_tfidf_vectorizers.joblib'))

        logger.info(f"All models saved to {self.model_dir}")

    def load_models(self) -> Dict[str, Any]:
        """Load pre-trained models"""
        models = {}

        try:
            models['feasibility'] = joblib.load(os.path.join(self.model_dir, 'goal_feasibility_model.joblib'))
            models['priority'] = joblib.load(os.path.join(self.model_dir, 'goal_priority_model.joblib'))
            models['timeline'] = joblib.load(os.path.join(self.model_dir, 'goal_timeline_classifier.joblib'))

            # Load allocation models
            for category in ['emergency', 'short', 'medium', 'long']:
                models[f'allocation_{category}'] = joblib.load(
                    os.path.join(self.model_dir, f'goal_allocation_{category}_model.joblib')
                )

            logger.info("All goal-based planning models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            models = {}

        return models

def main():
    """Main training function"""
    print("🎯 Starting Goal-Based Planning ML Model Training")
    print("=" * 60)

    # Check if dataset exists
    dataset_path = "synthetic_planora_dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found at {dataset_path}")
        print("Please ensure the synthetic_planora_dataset.csv file is in the project root.")
        return False

    try:
        # Initialize trainer
        trainer = GoalBasedPlanningMLTrainer(dataset_path)

        # Train all models
        print("🔄 Training ML models... This may take a few minutes.")
        results = trainer.train_all_models()

        # Display results
        print("\n✅ GOAL-BASED PLANNING MODEL TRAINING COMPLETED!")
        print("=" * 60)
        print("📊 Models trained:")
        print("  • Goal Feasibility Predictor (XGBoost)")
        print("  • Goal Priority Predictor (Random Forest)")
        print("  • Investment Allocation Models (4 categories)")
        print("  • Goal Timeline Classifier (Random Forest)")
        print(f"📁 Models saved to: backend/models/")

        return True

    except Exception as e:
        print(f"❌ Error during training: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
