# Planora AI Financial Advisor - Complete Setup Guide

This guide will help you set up and run the complete Planora system with ML-powered debt management analysis.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Models     │
│   (React/Vite)  │◄──►│   (FastAPI)     │◄──►│   (scikit-learn)│
│   Port: 5173    │    │   Port: 8000    │    │   (XGBoost)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### Required Software
- **Python 3.8+** (for ML backend)
- **Node.js 16+** (for React frontend)
- **npm or yarn** (package manager)

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space
- **OS**: Windows, macOS, or Linux

## 🚀 Quick Start (5 Steps)

### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd Planora
```

### Step 2: Install Python Dependencies
```bash
# Install Python packages for ML backend
pip install -r backend/requirements.txt
```

### Step 3: Install Node.js Dependencies
```bash
# Install React frontend packages
npm install
```

### Step 4: Train ML Models
```bash
# Train all ML models (takes 2-3 minutes)
python train_models.py
```

### Step 5: Start Both Servers
```bash
# Terminal 1: Start Python backend
python start_backend.py

# Terminal 2: Start React frontend
npm run dev
```

## 🔧 Detailed Setup Instructions

### Backend Setup (Python/FastAPI)

1. **Create Virtual Environment** (Recommended)
```bash
python -m venv planora-env

# Windows
planora-env\Scripts\activate

# macOS/Linux
source planora-env/bin/activate
```

2. **Install Dependencies**
```bash
pip install -r backend/requirements.txt
```

3. **Verify Dataset**
```bash
# Check if synthetic_planora_dataset.csv exists in root directory
ls synthetic_planora_dataset.csv
```

4. **Train ML Models**
```bash
python train_models.py
```
Expected output:
```
🚀 Starting Planora ML Model Training
==================================================
🔄 Training models... This may take a few minutes.

✅ MODEL TRAINING COMPLETED SUCCESSFULLY!
==================================================
📊 Dataset size: 1,001 records
🔧 Features used: 15
🤖 Models trained: 4
```

5. **Start Backend Server**
```bash
python start_backend.py
```
The backend will be available at: http://localhost:8000

### Frontend Setup (React/Vite)

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```
The frontend will be available at: http://localhost:5173

## 🧪 Testing the System

### 1. Health Check
Visit: http://localhost:8000/health
Expected response:
```json
{
  "status": "healthy",
  "models_loaded": 4,
  "dataset_loaded": true,
  "timestamp": "2024-01-01T12:00:00"
}
```

### 2. API Documentation
Visit: http://localhost:8000/docs
This shows interactive API documentation with all endpoints.

### 3. Test Debt Analysis
1. Go to: http://localhost:5173
2. Click "Debt Management" from the dashboard
3. Fill out the debt questionnaire
4. View ML-powered analysis results

### 4. Dataset Statistics
Visit: http://localhost:8000/dataset-stats
Shows statistics about the training dataset.

## 📊 ML Models Overview

The system trains 4 different ML models:

### 1. Risk Assessment Model
- **Type**: Random Forest Classifier
- **Purpose**: Predicts debt risk level (Low/Medium/High)
- **Features**: Income, expenses, debt ratios, payment history

### 2. Debt Capacity Model
- **Type**: XGBoost Regressor
- **Purpose**: Predicts maximum safe debt capacity
- **Output**: Recommended debt limit in ₹

### 3. Financial Health Model
- **Type**: Random Forest Classifier
- **Purpose**: Classifies overall financial health
- **Categories**: Good, Average, Poor

### 4. Customer Segmentation Model
- **Type**: K-Means Clustering
- **Purpose**: Groups users into financial behavior clusters
- **Clusters**: Conservative Savers, Balanced Borrowers, High-Risk Borrowers

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Models not loaded" Error
**Problem**: Backend shows models_loaded: 0
**Solution**:
```bash
python train_models.py
python start_backend.py
```

#### 2. CORS Errors in Frontend
**Problem**: API calls fail with CORS errors
**Solution**: Ensure backend is running on port 8000 and frontend on 5173

#### 3. Dataset Not Found
**Problem**: "Dataset not found" error during training
**Solution**: Ensure `synthetic_planora_dataset.csv` is in the root directory

#### 4. Port Already in Use
**Problem**: "Port 8000 already in use"
**Solution**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

#### 5. Python Package Conflicts
**Problem**: Import errors or version conflicts
**Solution**: Use virtual environment
```bash
python -m venv fresh-env
source fresh-env/bin/activate  # or fresh-env\Scripts\activate on Windows
pip install -r backend/requirements.txt
```

### Performance Issues

#### Slow Model Training
- **Normal**: 2-3 minutes for 1000+ records
- **If slower**: Check available RAM and CPU
- **Optimization**: Reduce dataset size for testing

#### High Memory Usage
- **Backend**: ~200-500MB normal
- **Frontend**: ~100-200MB normal
- **If higher**: Restart both servers

## 📁 File Structure

```
Planora/
├── backend/
│   ├── app.py                 # FastAPI main application
│   ├── ml_training.py         # ML model training script
│   ├── requirements.txt       # Python dependencies
│   └── models/               # Trained models (auto-generated)
│       ├── risk_model.joblib
│       ├── debt_capacity_model.joblib
│       ├── financial_health_model.joblib
│       ├── clustering_model.joblib
│       └── scaler.joblib
├── src/
│   ├── components/
│   │   ├── DebtQuestions.jsx  # Debt questionnaire
│   │   ├── DebtResult.jsx     # ML-powered results
│   │   └── DebtManagementCharts.jsx
│   └── utils/
│       └── apiClient.js       # Backend API integration
├── synthetic_planora_dataset.csv  # Training data
├── train_models.py           # Model training script
├── start_backend.py          # Backend startup script
└── SETUP_GUIDE.md           # This file
```

## 🔄 Development Workflow

### Making Changes

1. **Backend Changes**:
   - Modify files in `backend/`
   - Backend auto-reloads (thanks to `--reload` flag)

2. **Frontend Changes**:
   - Modify files in `src/`
   - Frontend auto-reloads (Vite HMR)

3. **Model Changes**:
   - Modify `backend/ml_training.py`
   - Re-run: `python train_models.py`
   - Restart backend: `python start_backend.py`

### Adding New Features

1. **New ML Model**:
   - Add training logic to `ml_training.py`
   - Add API endpoint in `app.py`
   - Update frontend to use new endpoint

2. **New Analysis Type**:
   - Extend questionnaire in `DebtQuestions.jsx`
   - Add analysis logic in backend
   - Update results display in `DebtResult.jsx`

## 📈 Production Deployment

### Environment Variables
Create `.env` file:
```
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment
```bash
# Build backend
docker build -t planora-backend ./backend

# Build frontend
docker build -t planora-frontend .

# Run with docker-compose
docker-compose up -d
```

## 🎯 Next Steps

1. **Extend ML Models**: Add more sophisticated algorithms
2. **Real-time Data**: Integrate with banking APIs
3. **Mobile App**: React Native implementation
4. **Advanced Analytics**: Time series forecasting
5. **User Authentication**: Secure user data storage

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Verify all dependencies are installed
3. Ensure both servers are running
4. Check browser console for errors
5. Review backend logs for API errors

## 🎉 Success!

When everything is working:
- ✅ Backend health check passes
- ✅ Frontend loads without errors
- ✅ Debt analysis provides ML-powered insights
- ✅ All 4 ML models are trained and loaded
- ✅ API endpoints respond correctly

You now have a fully functional AI-powered financial advisor system!
