// API Client for Planora Backend
const API_BASE_URL = 'http://localhost:8000';

export class PlanorAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }

  // Dataset statistics
  async getDatasetStats() {
    return this.makeRequest('/dataset-stats');
  }

  // Train models
  async trainModels() {
    return this.makeRequest('/train-models', {
      method: 'POST'
    });
  }

  // Format data for ML analysis
  formatMLData(data) {
    return {
      monthly_income: parseFloat(data.monthlyIncome) || 0,
      expenses: parseFloat(data.monthlyExpenses) || 0,
      savings: parseFloat(data.monthlySavings) || 0,
      emergency_fund: parseFloat(data.emergencyFund) || 0,
      debt_amount: parseFloat(data.totalDebt) || 0,
      monthly_emi: parseFloat(data.monthlyEMI) || 0,
      credit_score: parseInt(data.creditScore) || 700,
      age: parseInt(data.age) || 30,
      occupation: data.occupation || "Salaried",
      has_loans: data.hasLoans === "Yes"
    };
  }

  // Get ML analysis for debt data
  async analyzeDebt(userData) {
    const formattedData = this.formatMLData(userData);
    return this.makeRequest('/analyze-debt', {
      method: 'POST',
      body: JSON.stringify(formattedData)
    });
  }

  // Get debt recommendations (legacy method for backward compatibility)
  async getDebtRecommendations(userData) {
    const formattedData = this.formatMLData(userData);
    return this.makeRequest('/debt-recommendations', {
      method: 'POST',
      body: JSON.stringify(formattedData)
    });
  }

  // Assess debt risk
  async assessDebtRisk(data) {
    return this.makeRequest('/assess-risk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Legacy method for backward compatibility
  async analyzeDebtLegacy(debtData) {
    return this.makeRequest('/analyze-debt', {
      method: 'POST',
      body: JSON.stringify(debtData)
    });
  }
}

// Create singleton instance
const api = new PlanorAPI();

// Export API methods
export const healthCheck = () => api.healthCheck();
export const getDatasetStats = () => api.getDatasetStats();
export const trainModels = () => api.trainModels();
export const analyzeDebt = (data) => api.analyzeDebt(data);
export const formatDebtAnalysisData = (answers) => {
  const parseNumber = (value) => {
    if (!value) return 0;
    const num = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const extractPercentage = (str) => {
    if (!str) return 0;
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };

  // Estimate income from EMI ratio if not provided directly
  const emiRatio = extractPercentage(answers.emiToIncomeRatio);
  const monthlyEMI = parseNumber(answers.monthlyEMI);
  const estimatedIncome = emiRatio > 0 ? (monthlyEMI / (emiRatio / 100)) : 50000;

  return {
    monthly_income: estimatedIncome,
    expenses: estimatedIncome * 0.6, // Estimate 60% of income as expenses
    savings: Math.max(0, estimatedIncome - (estimatedIncome * 0.6) - monthlyEMI),
    emergency_fund: parseNumber(answers.emergencyFund) || (estimatedIncome * 3), // Default 3 months
    debt_amount: parseNumber(answers.totalDebt),
    monthly_emi: monthlyEMI,
    age: 35, // Default age
    occupation: "Salaried", // Default occupation
    has_loans: answers.hasLoans === 'Yes'
  };
};

// Export the API instance for advanced usage
export default api;
