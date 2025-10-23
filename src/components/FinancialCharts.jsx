import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';

const FinancialCharts = ({ answers }) => {
  if (!answers) {
    return <div>No data available for charts</div>;
  }

  const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  const monthlyIncome = num(answers.monthlyIncome);
  const monthlyExpense = num(answers.monthlyExpense);
  const monthlyEMI = num(answers.monthlyEMI);
  const monthlySavings = num(answers.monthlySavings);

  // Calculate financial ratios
  const savingsFromIncome = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;
  const expenseToIncome = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;
  const debtToIncome = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) * 100 : 0;

  // Income Allocation Data
  const incomeAllocationData = [
    { name: 'Expenses', value: monthlyExpense, color: '#ef4444' },
    { name: 'EMI/Debt', value: monthlyEMI, color: '#f97316' },
    { name: 'Available', value: Math.max(0, monthlyIncome - monthlyExpense - monthlyEMI), color: '#22c55e' },
  ].filter(item => item.value > 0);

  // Financial Ratios Data
  const ratiosData = [
    { name: 'Savings Rate', current: savingsFromIncome, ideal: 20 },
    { name: 'Expense Ratio', current: expenseToIncome, ideal: 60 },
    { name: 'Debt Ratio', current: debtToIncome, ideal: 20 },
  ];

  // Financial Health Score
  const getHealthScore = () => {
    let score = 0;
    if (savingsFromIncome >= 20) score += 40;
    else if (savingsFromIncome >= 10) score += 25;
    else score += 10;
    
    if (expenseToIncome <= 60) score += 30;
    else if (expenseToIncome <= 80) score += 20;
    else score += 5;
    
    if (debtToIncome <= 20) score += 30;
    else if (debtToIncome <= 40) score += 15;
    else score += 0;
    
    return Math.min(score, 100);
  };

  const healthScore = getHealthScore();
  const healthScoreData = [
    { name: 'Score', value: healthScore, fill: healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#f59e0b' : '#ef4444' },
  ];

  const getScoreLabel = () => {
    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 60) return 'Good';
    if (healthScore >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / monthlyIncome) * 100).toFixed(1);
      return (
        <div className="chart-tooltip">
          <p className="font-medium">{data.name}</p>
          <p className="text-blue-600">₹{data.value.toLocaleString()} ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const RatiosTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">Current: {payload[0].value.toFixed(1)}%</p>
          <p className="text-gray-600">Ideal: {payload[1].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="charts-grid">
      {/* Income Allocation Donut Chart */}
      <div className="chart-card">
        <h3>Income Allocation</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={incomeAllocationData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            >
              {incomeAllocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-summary">
          <div className="summary-value">₹{monthlyIncome.toLocaleString()}</div>
          <div className="summary-label">Total Monthly Income</div>
        </div>
      </div>

      {/* Financial Health Score */}
      <div className="chart-card">
        <h3>Financial Health Score</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={healthScoreData}>
            <RadialBar
              minAngle={15}
              label={{ position: 'insideStart', fill: '#fff' }}
              background
              clockWise
              dataKey="value"
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="score-text">
              {healthScore}
            </text>
            <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="score-suffix">
              / 100
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="chart-summary">
          <div className={`summary-value ${
            healthScore >= 80 ? 'text-green-600' : 
            healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {getScoreLabel()}
          </div>
          <div className="summary-label">Overall Financial Health</div>
        </div>
      </div>

      {/* Financial Ratios Comparison */}
      <div className="chart-card">
        <h3>Financial Ratios vs Ideal</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ratiosData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<RatiosTooltip />} />
            <Legend />
            <Bar dataKey="current" fill="#3b82f6" name="Current %" />
            <Bar dataKey="ideal" fill="#94a3b8" name="Ideal %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Progress */}
      <div className="chart-card">
        <h3>Savings Goals Progress</h3>
        <div className="progress-section">
          {/* Savings Rate Goal */}
          <div className="progress-item">
            <div className="progress-header">
              <span className="progress-label">Savings Rate Goal (20%)</span>
              <span className="progress-value">{savingsFromIncome.toFixed(1)}% / 20%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar savings-progress"
                style={{ width: `${Math.min((savingsFromIncome / 20) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="progress-note">
              {savingsFromIncome >= 20 ? '🎉 Goal Achieved!' : `${(20 - savingsFromIncome).toFixed(1)}% to go`}
            </div>
          </div>

          {/* Emergency Fund Goal */}
          <div className="progress-item">
            <div className="progress-header">
              <span className="progress-label">Emergency Fund (6 months expenses)</span>
              <span className="progress-value">Target: ₹{(monthlyExpense * 6).toLocaleString()}</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar emergency-progress"
                style={{ width: '25%' }}
              ></div>
            </div>
            <div className="progress-note">
              Start building your emergency fund
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;
