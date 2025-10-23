import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, mean_squared_error, r2_score, silhouette_score
import xgboost as xgb
import joblib
import os
import logging
from typing import Dict, Any, Tuple
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DebtManagementMLTrainer:
    """ML Training class for debt management models"""
    
    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        self.dataset = None
        self.models = {}
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.model_dir = os.path.join(os.path.dirname(__file__), "models")
        
        # Create models directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)
    
    def load_and_preprocess_data(self) -> pd.DataFrame:
        """Load and preprocess the dataset"""
        logger.info("Loading dataset...")
        
        # Load dataset
        self.dataset = pd.read_csv(self.dataset_path)
        logger.info(f"Dataset loaded with {len(self.dataset)} records and {len(self.dataset.columns)} columns")
        
        # Handle missing values
        self.dataset = self.dataset.fillna(0)
        
        # Create derived features
        self.dataset['debt_to_income_ratio'] = self.dataset['debt_amount'] / (self.dataset['monthly_income'] + 1)
        self.dataset['emi_to_income_ratio'] = self.dataset['monthly_emi'] / (self.dataset['monthly_income'] + 1)
        self.dataset['savings_to_income_ratio'] = self.dataset['savings'] / (self.dataset['monthly_income'] + 1)
        self.dataset['expense_to_income_ratio'] = self.dataset['expenses'] / (self.dataset['monthly_income'] + 1)
        
        # Encode categorical variables
        categorical_columns = ['occupation', 'investment_type', 'risk_appetite', 'short_term_goals', 'long_term_goals']
        
        for col in categorical_columns:
            if col in self.dataset.columns:
                le = LabelEncoder()
                self.dataset[f'{col}_encoded'] = le.fit_transform(self.dataset[col].astype(str))
                self.label_encoders[col] = le
        
        # Create binary features
        self.dataset['has_loans_binary'] = self.dataset['has_loans'].astype(int)
        self.dataset['invests_binary'] = self.dataset['invests'].astype(int)
        
        # Create financial health target (0: Good, 1: Average, 2: Poor)
        health_mapping = {'Good': 0, 'Average': 1, 'Poor': 2}
        self.dataset['financial_health_encoded'] = self.dataset['financial_health'].map(health_mapping)
        
        logger.info("Data preprocessing completed")
        return self.dataset
    
    def prepare_features(self) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
        """Prepare feature matrices for different models"""
        
        # Base features for all models
        base_features = [
            'age', 'monthly_income', 'expenses', 'fixed_expenses', 'variable_expenses',
            'debt_amount', 'monthly_emi', 'savings', 'emergency_fund',
            'debt_to_income_ratio', 'emi_to_income_ratio', 'savings_to_income_ratio',
            'expense_to_income_ratio', 'has_loans_binary', 'invests_binary'
        ]
        
        # Add encoded categorical features
        encoded_features = [col for col in self.dataset.columns if col.endswith('_encoded')]
        all_features = base_features + encoded_features
        
        # Remove any features that don't exist in the dataset
        available_features = [f for f in all_features if f in self.dataset.columns]
        
        X = self.dataset[available_features].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Prepare target variables
        targets = {
            'financial_health': self.dataset['financial_health_encoded'].values,
            'debt_amount': self.dataset['debt_amount'].values,
            'risk_binary': (self.dataset['financial_health'] == 'Poor').astype(int).values
        }
        
        logger.info(f"Feature matrix shape: {X_scaled.shape}")
        return X_scaled, targets
    
    def train_risk_assessment_model(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Train risk assessment model using Random Forest"""
        logger.info("Training risk assessment model...")
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Train Random Forest
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'
        )
        
        rf_model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = rf_model.score(X_train, y_train)
        test_score = rf_model.score(X_test, y_test)
        
        # Cross-validation
        cv_scores = cross_val_score(rf_model, X, y, cv=5)
        
        logger.info(f"Risk Model - Train Score: {train_score:.3f}, Test Score: {test_score:.3f}")
        logger.info(f"Risk Model - CV Score: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        self.models['risk_model'] = rf_model
        
        return {
            'model_type': 'RandomForestClassifier',
            'train_score': train_score,
            'test_score': test_score,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std()
        }
    
    def train_debt_capacity_model(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Train debt capacity prediction model"""
        logger.info("Training debt capacity model...")
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train XGBoost Regressor
        xgb_model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        xgb_model.fit(X_train, y_train)
        
        # Evaluate model
        train_pred = xgb_model.predict(X_train)
        test_pred = xgb_model.predict(X_test)
        
        train_r2 = r2_score(y_train, train_pred)
        test_r2 = r2_score(y_test, test_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
        
        logger.info(f"Debt Capacity Model - Train R2: {train_r2:.3f}, Test R2: {test_r2:.3f}")
        logger.info(f"Debt Capacity Model - Train RMSE: {train_rmse:.0f}, Test RMSE: {test_rmse:.0f}")
        
        self.models['debt_capacity_model'] = xgb_model
        
        return {
            'model_type': 'XGBRegressor',
            'train_r2': train_r2,
            'test_r2': test_r2,
            'train_rmse': train_rmse,
            'test_rmse': test_rmse
        }
    
    def train_financial_health_model(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Train financial health classification model"""
        logger.info("Training financial health model...")
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Train Random Forest
        rf_model = RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=3,
            min_samples_leaf=1,
            random_state=42,
            class_weight='balanced'
        )
        
        rf_model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = rf_model.score(X_train, y_train)
        test_score = rf_model.score(X_test, y_test)
        
        # Cross-validation
        cv_scores = cross_val_score(rf_model, X, y, cv=5)
        
        logger.info(f"Financial Health Model - Train Score: {train_score:.3f}, Test Score: {test_score:.3f}")
        logger.info(f"Financial Health Model - CV Score: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        self.models['financial_health_model'] = rf_model
        
        return {
            'model_type': 'RandomForestClassifier',
            'train_score': train_score,
            'test_score': test_score,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std()
        }
    
    def train_clustering_model(self, X: np.ndarray) -> Dict[str, Any]:
        """Train customer segmentation clustering model"""
        logger.info("Training clustering model...")
        
        # Use subset of features for clustering
        clustering_features = X[:, :8]  # First 8 features for clustering
        
        # Find optimal number of clusters using silhouette score
        silhouette_scores = []
        k_range = range(2, 8)
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(clustering_features)
            silhouette_avg = silhouette_score(clustering_features, cluster_labels)
            silhouette_scores.append(silhouette_avg)
        
        # Choose k with highest silhouette score
        optimal_k = k_range[np.argmax(silhouette_scores)]
        
        # Train final clustering model
        kmeans_model = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
        cluster_labels = kmeans_model.fit_predict(clustering_features)
        
        final_silhouette = silhouette_score(clustering_features, cluster_labels)
        
        logger.info(f"Clustering Model - Optimal K: {optimal_k}, Silhouette Score: {final_silhouette:.3f}")
        
        self.models['clustering_model'] = kmeans_model
        
        return {
            'model_type': 'KMeans',
            'optimal_k': optimal_k,
            'silhouette_score': final_silhouette,
            'cluster_sizes': np.bincount(cluster_labels).tolist()
        }
    
    def save_models(self) -> None:
        """Save all trained models"""
        logger.info("Saving models...")
        
        # Save models
        for model_name, model in self.models.items():
            model_path = os.path.join(self.model_dir, f"{model_name}.joblib")
            joblib.dump(model, model_path)
            logger.info(f"Saved {model_name} to {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(self.model_dir, "scaler.joblib")
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Saved scaler to {scaler_path}")
        
        # Save label encoders
        encoders_path = os.path.join(self.model_dir, "label_encoders.joblib")
        joblib.dump(self.label_encoders, encoders_path)
        logger.info(f"Saved label encoders to {encoders_path}")
    
    def train_all_models(self) -> Dict[str, Any]:
        """Train all models and return results"""
        try:
            # Load and preprocess data
            self.load_and_preprocess_data()
            
            # Prepare features
            X, targets = self.prepare_features()
            
            # Train models
            results = {}
            
            # 1. Risk Assessment Model
            results['risk_model'] = self.train_risk_assessment_model(X, targets['risk_binary'])
            
            # 2. Debt Capacity Model
            results['debt_capacity_model'] = self.train_debt_capacity_model(X, targets['debt_amount'])
            
            # 3. Financial Health Model
            results['financial_health_model'] = self.train_financial_health_model(X, targets['financial_health'])
            
            # 4. Clustering Model
            results['clustering_model'] = self.train_clustering_model(X)
            
            # Save all models
            self.save_models()
            
            logger.info("All models trained and saved successfully!")
            
            return {
                'status': 'success',
                'models_trained': len(self.models),
                'dataset_size': len(self.dataset),
                'feature_count': X.shape[1],
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            raise e

# Async wrapper for FastAPI
async def train_all_models(dataset: pd.DataFrame = None) -> Dict[str, Any]:
    """Async wrapper for training models"""
    
    if dataset is not None:
        # Save dataset temporarily if passed as parameter
        temp_path = "temp_dataset.csv"
        dataset.to_csv(temp_path, index=False)
        dataset_path = temp_path
    else:
        # Use default dataset path
        dataset_path = os.path.join(os.path.dirname(__file__), "..", "synthetic_planora_dataset.csv")
    
    trainer = DebtManagementMLTrainer(dataset_path)
    results = trainer.train_all_models()
    
    # Clean up temporary file
    if dataset is not None and os.path.exists(temp_path):
        os.remove(temp_path)
    
    return results

# CLI interface for standalone training
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train Debt Management ML Models")
    parser.add_argument("--dataset", type=str, default="../synthetic_planora_dataset.csv", 
                       help="Path to the dataset CSV file")
    
    args = parser.parse_args()
    
    trainer = DebtManagementMLTrainer(args.dataset)
    results = trainer.train_all_models()
    
    print("\n" + "="*50)
    print("MODEL TRAINING COMPLETED")
    print("="*50)
    print(f"Models trained: {results['models_trained']}")
    print(f"Dataset size: {results['dataset_size']}")
    print(f"Feature count: {results['feature_count']}")
    print("\nModel Performance Summary:")
    for model_name, metrics in results['results'].items():
        print(f"\n{model_name}:")
        for metric, value in metrics.items():
            print(f"  {metric}: {value}")
