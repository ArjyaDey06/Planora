import React, { useEffect, useState } from 'react';
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
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  predictDebtCapacity,
  analyzeFinancialBehavior,
  getDebtManagementRecommendations,
  assessDebtRisk
} from '../utils/debtAnalysis';

const DebtManagementCharts = ({ answers }) => {
  const [mlAnalysis, setMlAnalysis] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const performMLAnalysis = async () => {
      if (!answers) return;
      setIsLoading(true);
      setError(null);

      const userData = {
        monthly_income: num(answers.monthlyIncome),
        expenses: num(answers.monthlyExpenses),
        savings: num(answers.monthlySavings),
        emergency_fund: num(answers.emergencyFund),
        debt_amount: num(answers.totalDebt),
        monthly_emi: num(answers.monthlyEMI),
        credit_score: answers.creditScore,
        missed_payments: answers.missedPayments,
        loan_types: answers.loanTypes || []
      };

      try {
        const [debtCapacity, behavior] = await Promise.all([
          predictDebtCapacity(
            userData.monthly_income,
            userData.expenses,
            userData.savings
          ),
          analyzeFinancialBehavior([userData])
        ]);

        setMlAnalysis({
          debtCapacity,
          behavior,
          riskScore: debtCapacity.confidenceScore,
          riskCategory: behavior.healthScore > 70 ? 'Low Risk' : behavior.healthScore > 40 ? 'Medium Risk' : 'High Risk',
          recommendations: behavior.recommendations
        });
      } catch (error) {
        console.error('ML Analysis Error:', error);
        setError('Failed to analyze financial data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    performMLAnalysis();
  }, [answers]);

  if (!answers) {
    return (
      <div className="charts-section">
        <div className="charts-wrapper">
          <div className="chart-container">
            <h3>No data available</h3>
          </div>
        </div>
      </div>
    );
  }

  const chartStyle = {
    width: '100%',
    height: '300px',
    marginBottom: '2rem'
  };
  if (!answers) {
    return <div>No data available for charts</div>;
  }

  const num = (v) => {
    if (!v) return 0;
    const n = parseFloat(v.toString().replace(/[^0-9.-]+/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const validateData = (data) => {
    return data.filter(item => item.value > 0);
  };

  // Core financial metrics
  const totalDebt = num(answers.totalDebt);
  const monthlyEMI = num(answers.monthlyEMI);
  const outstandingCredit = num(answers.outstandingCreditBalance);
  const remainingAmount = num(answers.remainingAmount);

  // Get EMI to Income ratio from string input
  const extractPercentage = (str) => {
    if (!str) return 0;
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };
  const emiToIncomeRatio = extractPercentage(answers.emiToIncomeRatio);

  // Debt Composition Data
  let debtCompositionData = [
    { name: 'Remaining Loan', value: remainingAmount, color: '#3b82f6' },
    { name: 'Credit Card', value: outstandingCredit, color: '#ef4444' },
    { name: 'Other Debt', value: Math.max(0, totalDebt - remainingAmount - outstandingCredit), color: '#f97316' },
  ];
  debtCompositionData = validateData(debtCompositionData);

  // Default data if no valid data exists
  if (debtCompositionData.length === 0) {
    debtCompositionData = [{ name: 'No debt data', value: 100, color: '#e5e7eb' }];
  }

  // EMI Impact Metrics
  const emiImpactData = [
    { name: 'EMI Burden', current: emiToIncomeRatio, ideal: 40, color: '#3b82f6' },
  ];

  // Payment History Analysis (based on missed payments)
  const getPaymentScore = (missedPayments) => {
    const text = missedPayments?.toLowerCase() || '';
    if (text.includes('never')) return 100;
    if (text.includes('3-4')) return 40;
    return 20; // more than 4 times
  };

  const paymentHistoryScore = getPaymentScore(answers.missedPayments);
  const paymentHealthData = [
    { name: '', value: paymentHistoryScore, color: paymentHistoryScore > 80 ? '#22c55e' : paymentHistoryScore > 60 ? '#f97316' : '#ef4444' }
  ];

  // ML-Enhanced Risk Analysis
  const riskAnalysisData = mlAnalysis ? [
    {
      value: mlAnalysis.riskAssessment.riskScore * 100,
      color: mlAnalysis.riskAssessment.riskCategory === 'High Risk' ? '#ef4444' :
             mlAnalysis.riskAssessment.riskCategory === 'Medium Risk' ? '#f97316' : '#22c55e'
    }
  ] : [];

  // Debt Capacity Analysis
  const debtCapacityData = mlAnalysis ? [
    { name: 'Current Debt', value: totalDebt, color: '#ef4444' },
    { name: 'Available Capacity', value: Math.max(0, mlAnalysis.debtCapacity.maxDebtCapacity - totalDebt), color: '#22c55e' }
  ] : [];

  const containerStyle = {
    padding: '32px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '32px',
    minHeight: '500px',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem',
    textAlign: 'center'
  };

  return (
    <div className="charts-section" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      <div className="charts-wrapper" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '32px',
        width: '100%'
      }}>
        {/* Debt Composition Chart */}
        <div className="chart-container" style={containerStyle}>
        <h3 style={headerStyle}>Debt Composition</h3>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={debtCompositionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {debtCompositionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend verticalAlign="bottom" align="center" layout="horizontal" />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* EMI Impact Chart */}
      <div className="chart-container" style={containerStyle}>
        <h3 style={headerStyle}>EMI to Income Ratio</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={emiImpactData}
            layout="vertical"
            margin={{ top: 30, right: 80, left: 60, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <YAxis type="category" dataKey="name" />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="current" fill="#3b82f6" name="Current" />
            <Bar dataKey="ideal" fill="#22c55e" name="Maximum Safe Limit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Health Score */}
      <div className="chart-container" style={containerStyle}>
        <h3 style={headerStyle}>Payment Health Score</h3>
        <ResponsiveContainer width="100%" height={350}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="90%"
            barSize={15}
            data={paymentHealthData}
          >
            <RadialBar
              minAngle={15}
              clockWise
              dataKey="value"
              cornerRadius={0}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="progress-label"
              fill={paymentHistoryScore > 80 ? '#22c55e' : paymentHistoryScore > 60 ? '#f97316' : '#ef4444'}
            >
              <tspan x="50%" dy="0" fontSize="2.5em" fontWeight="bold">
                {paymentHistoryScore}
              </tspan>
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DebtManagementCharts;