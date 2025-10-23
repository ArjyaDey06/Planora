import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';

export class FinancialHealthModel {
  constructor() {
    this.model = null;
    this.labelEncoder = {};
    this.featureColumns = [
      'age', 'monthly_income', 'expenses', 'has_loans', 'debt_amount', 
      'monthly_emi', 'savings', 'emergency_fund', 'invests'
    ];
    this.labelColumn = 'money_allocation';
    this.allocationCategories = [
      'Emergency Fund', 'Savings', 'Investments', 'Debt Payment', 'Living Expenses', 'Insurance'
    ];
  }

  // Preprocess the data
  preprocessData(data) {
    // Convert string values to appropriate types
    const processedData = data.map(row => ({
      ...row,
      age: parseInt(row.age),
      monthly_income: parseFloat(row.monthly_income),
      expenses: parseFloat(row.expenses),
      has_loans: row.has_loans === 'True',
      debt_amount: parseFloat(row.debt_amount) || 0,
      monthly_emi: parseFloat(row.monthly_emi) || 0,
      savings: parseFloat(row.savings) || 0,
      emergency_fund: parseFloat(row.emergency_fund) || 0,
      invests: row.invests === 'True',
      financial_health: row.financial_health
    }));

    // Calculate additional features
    return processedData.map(row => ({
      ...row,
      debt_to_income_ratio: row.monthly_income > 0 ? (row.debt_amount / row.monthly_income) : 0,
      savings_rate: row.monthly_income > 0 ? (row.savings / row.monthly_income) : 0,
      emergency_months: row.expenses > 0 ? (row.emergency_fund / row.expenses) : 0
    }));
  }

  // Prepare data for training
  prepareData(processedData) {
    // Encode categorical variables
    const encodedData = processedData.map(row => {
      const features = [
        row.age / 100, // Normalize age
        row.monthly_income / 10000, // Scale down large numbers
        row.expenses / 10000,
        row.has_loans ? 1 : 0,
        row.debt_amount / 10000,
        row.monthly_emi / 1000,
        row.savings / 1000,
        row.emergency_fund / 1000,
        row.invests ? 1 : 0,
        row.debt_to_income_ratio,
        row.savings_rate,
        row.emergency_months
      ];

      // Create allocation targets based on financial situation
      const income = row.monthly_income;
      const allocationTargets = this.generateAllocationTargets(row);

      return { xs: features, ys: allocationTargets };
    });

    // Shuffle the data
    tf.util.shuffle(encodedData);

    // Split into features and labels
    const xs = encodedData.map(d => d.xs);
    const ys = encodedData.map(d => d.ys);

    // Convert to tensors - no one-hot encoding for regression
    const xsTensor = tf.tensor2d(xs, [xs.length, 12]);
    const ysTensor = tf.tensor2d(ys, [ys.length, 6]); // Direct percentage values

    return { xs: xsTensor, ys: ysTensor };
  }

  // Generate optimal money allocation targets based on financial situation
  generateAllocationTargets(row) {
    const income = row.monthly_income;
    const expenses = row.expenses;
    const debtAmount = row.debt_amount;
    const savings = row.savings;
    const emergencyFund = row.emergency_fund;

    // Base allocation percentages (as decimals)
    let allocation = {
      'Emergency Fund': 0.10, // 10% for emergency fund
      'Savings': 0.15,        // 15% for savings
      'Investments': 0.10,    // 10% for investments
      'Debt Payment': 0.00,   // 0% default for debt
      'Living Expenses': 0.60, // 60% for living expenses
      'Insurance': 0.05       // 5% for insurance
    };

    // Adjust based on current financial situation
    if (debtAmount > 0) {
      const debtRatio = debtAmount / income;
      if (debtRatio > 0.4) {
        // High debt - prioritize debt repayment
        allocation['Debt Payment'] = Math.min(0.25, debtAmount / income);
        allocation['Emergency Fund'] = 0.05;
        allocation['Savings'] = 0.05;
        allocation['Living Expenses'] = 0.60;
      } else if (debtRatio > 0.2) {
        // Moderate debt - balanced approach
        allocation['Debt Payment'] = Math.min(0.15, debtAmount / income * 0.5);
        allocation['Emergency Fund'] = 0.08;
        allocation['Savings'] = 0.12;
      }
    }

    if (emergencyFund < expenses * 3) {
      // Need to build emergency fund
      allocation['Emergency Fund'] += 0.05;
      allocation['Savings'] -= 0.03;
      allocation['Investments'] -= 0.02;
    }

    if (savings / income < 0.1) {
      // Low savings rate - increase savings
      allocation['Savings'] += 0.05;
      allocation['Living Expenses'] -= 0.03;
      allocation['Investments'] -= 0.02;
    }

    // Normalize to ensure total is 100%
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    Object.keys(allocation).forEach(key => {
      allocation[key] = allocation[key] / total;
    });

    return this.allocationCategories.map(cat => allocation[cat]);
  }

  // Create the model
  createModel() {
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      inputShape: [12],
      units: 32,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    
    // Add dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Hidden layer
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    
    // Output layer - Linear activation for regression (predicting percentages)
    model.add(tf.layers.dense({
      units: 6, // 6 allocation categories
      activation: 'linear' // Linear activation for regression
    }));
    
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError', // MSE for regression
      metrics: ['mse'] // Mean squared error as metric
    });
    
    return model;
  }

  // Train the model
  async train(xs, ys, onEpochEnd) {
    // Create the model
    this.model = this.createModel();
    
    // Train the model
    const history = await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (onEpochEnd) {
            onEpochEnd(epoch, logs);
          }
          await tf.nextFrame();
        }
      }
    });
    
    return history;
  }

  // Make predictions
  predict(features) {
    if (!this.model) {
      throw new Error('Model not trained. Please train the model first.');
    }

    // Convert features to tensor and make prediction
    const inputTensor = tf.tensor2d([features]);
    const prediction = this.model.predict(inputTensor);
    const predictionData = prediction.dataSync();

    // Convert prediction to allocation recommendations
    const result = {
      allocations: {},
      totalPercentage: 0
    };

    // Apply softmax to convert raw outputs to probabilities
    const maxVal = Math.max(...predictionData);
    const expValues = predictionData.map(x => Math.exp(x - maxVal));
    const sumExp = expValues.reduce((a, b) => a + b, 0);

    this.allocationCategories.forEach((category, index) => {
      result.allocations[category] = expValues[index] / sumExp;
      result.totalPercentage += result.allocations[category];
    });

    return result;
  }

  // Load and preprocess data from CSV
  async loadAndPrepareData(csvData) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          try {
            const processedData = this.preprocessData(results.data);
            const { xs, ys } = this.prepareData(processedData);
            resolve({ xs, ys });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  // Save model to IndexedDB
  async saveModel() {
    if (!this.model) {
      throw new Error('No model to save. Please train a model first.');
    }
    
    const saveResult = await this.model.save('indexeddb://financial-health-model');
    return saveResult;
  }

  // Load model from IndexedDB
  async loadModel() {
    try {
      this.model = await tf.loadLayersModel('indexeddb://financial-health-model');
      return true;
    } catch (error) {
      console.warn('No saved model found:', error);
      return false;
    }
  }

  // Generate allocation recommendations for form data
  generateAllocationFromFormData(formData) {
    const monthlyIncome = parseFloat(formData.monthlyIncome) || 0;
    const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
    const monthlySavings = parseFloat(formData.monthlySavings) || 0;
    const debtAmount = parseFloat(formData.debtAmount) || 0;
    const debtPayments = parseFloat(formData.debtPayments) || 0;
    
    // Calculate emergency fund months
    let emergencyMonths = 0;
    if (formData.emergencyFundMonths === 'Less than 3 months') emergencyMonths = 1.5;
    else if (formData.emergencyFundMonths === '3-6 months') emergencyMonths = 4.5;
    else if (formData.emergencyFundMonths === '6+ months') emergencyMonths = 9;
    
    const estimatedEmergencyFund = emergencyMonths * monthlyExpenses;
    
    // Base allocation percentages
    let allocation = {
      'Emergency Fund': 0.10,
      'Savings': 0.15,
      'Investments': 0.10,
      'Debt Payment': 0.00,
      'Living Expenses': 0.60,
      'Insurance': 0.05
    };

    // Adjust based on debt
    if (debtPayments > 0) {
      const debtRatio = debtPayments / monthlyIncome;
      if (debtRatio > 0.4) {
        allocation['Debt Payment'] = Math.min(0.25, debtRatio);
        allocation['Emergency Fund'] = 0.05;
        allocation['Savings'] = 0.05;
      } else if (debtRatio > 0.2) {
        allocation['Debt Payment'] = debtRatio * 0.8;
        allocation['Emergency Fund'] = 0.08;
        allocation['Savings'] = 0.12;
      } else {
        allocation['Debt Payment'] = debtRatio;
      }
    }

    // Adjust based on emergency fund status
    if (estimatedEmergencyFund < monthlyExpenses * 3) {
      allocation['Emergency Fund'] += 0.05;
      allocation['Savings'] -= 0.03;
      allocation['Investments'] -= 0.02;
    }

    // Adjust based on savings rate
    const currentSavingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;
    if (currentSavingsRate < 0.1) {
      allocation['Savings'] += 0.05;
      allocation['Living Expenses'] -= 0.03;
      allocation['Investments'] -= 0.02;
    }

    // Adjust based on savings habits
    if (formData.saveMonthly === 'No') {
      allocation['Savings'] += 0.05;
      allocation['Living Expenses'] -= 0.05;
    }

    // Normalize to ensure total is 100%
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    Object.keys(allocation).forEach(key => {
      allocation[key] = allocation[key] / total;
    });

    const result = {
      allocations: {},
      totalPercentage: 0
    };

    this.allocationCategories.forEach((category, index) => {
      result.allocations[category] = allocation[category];
      result.totalPercentage += allocation[category];
    });

    return result;
  }
}

// Helper function to load CSV data
const loadCSV = async (url) => {
  const response = await fetch(url);
  return await response.text();
};

export { loadCSV };

export default FinancialHealthModel;
