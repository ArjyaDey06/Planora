// Debt Analysis Utilities - Now using Python Backend API
import { PlanorAPI, formatDebtAnalysisData } from './apiClient';

const api = new PlanorAPI();

export const predictDebtCapacity = async (income, expenses, savings) => {
  try {
    const formattedData = {
      monthly_income: income,
      expenses: expenses,
      savings: savings,
      emergency_fund: savings, // Use actual emergency fund
      debt_amount: 0,
      monthly_emi: 0,
      age: 35,
      occupation: "Salaried",
      has_loans: false
    };
    
    const analysis = await api.analyzeDebt(formattedData);
    return {
      maxDebtCapacity: analysis.debt_capacity,
      recommendedMonthlyEMI: analysis.recommended_emi,
      confidenceScore: analysis.confidence_score
    };
  } catch (error) {
    console.error('Error in predictDebtCapacity:', error);
    throw new Error('Failed to predict debt capacity');
  }
};

export const analyzeFinancialBehavior = async (data) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data provided for analysis');
    }
    
    const formattedData = formatDebtAnalysisData(data[0]);
    const analysis = await api.analyzeDebt(formattedData);
    
    return {
      clusters: [analysis.cluster],
      behavior: analysis.financial_behavior,
      healthScore: analysis.health_score,
      recommendations: analysis.behavior_recommendations
    };
  } catch (error) {
    console.error('Error in analyzeFinancialBehavior:', error);
    throw new Error('Failed to analyze financial behavior');
  }
};

// Legacy function for backward compatibility
export const getDebtManagementRecommendations = (userData) => {
  // This now returns static recommendations since ML analysis is done in backend
  const debtRatio = userData.debt_amount / userData.monthly_income;
  const emiRatio = userData.monthly_emi / userData.monthly_income;
  
  const recommendations = [];
  const actionItems = [];
  
  if (debtRatio > 0.5) {
    recommendations.push('Consider debt consolidation');
    actionItems.push({
      priority: 'High',
      action: 'Restructure loans to reduce EMI burden',
      impact: 'Immediate relief in monthly cash flow'
    });
  }
  
  if (emiRatio > 0.4) {
    recommendations.push('Refinance loans for better rates');
    actionItems.push({
      priority: 'High',
      action: 'Consider debt consolidation',
      impact: 'Lower interest rates and simplified payments'
    });
  }
  
  return {
    riskLevel: debtRatio > 0.5 ? 'High' : debtRatio > 0.3 ? 'Medium' : 'Low',
    recommendations,
    actionItems
  };
};

// Legacy function for backward compatibility
export const assessDebtRisk = async (userData) => {
  try {
    const formattedData = formatDebtAnalysisData(userData);
    const analysis = await analyzeDebt(formattedData);
    
    return {
      riskScore: analysis.risk_score,
      riskCategory: analysis.risk_category,
      confidenceScore: analysis.confidence_score
    };
  } catch (error) {
    console.error('Error in assessDebtRisk:', error);
    const debtRatio = userData.debt_amount / userData.monthly_income;
    return {
      riskScore: Math.min(debtRatio, 1),
      confidenceScore: 0.7
    };
  }
};

// Export the main analysis function
export { analyzeDebt } from './apiClient';