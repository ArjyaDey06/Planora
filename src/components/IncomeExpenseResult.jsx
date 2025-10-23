import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FinancialCharts from './FinancialCharts';
import './IncomeExpenseResult.css';

const IncomeExpenseResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const answers = location.state?.answers;
  const [activeTab, setActiveTab] = useState('insights');
  const [animateMetrics, setAnimateMetrics] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateMetrics(true), 100);
  }, []);

  const onBackToDashboard = () => {
    navigate('/');
  };

  if (!answers) {
    return (
      <div className="questions-container">
        <div className="question-card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Data Available</h3>
            <p>Please complete the questionnaire first to see your financial analysis.</p>
            <button onClick={onBackToDashboard} className="btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const insightIcons = {
    'insight-success': '✅',
    'insight-warning': '⚠️',
    'insight-danger': '🚨',
    'insight-info': '💡'
  };

  const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  const monthlyIncome = num(answers.monthlyIncome);
  const monthlyExpense = num(answers.monthlyExpense);
  const monthlySavings = num(answers.monthlySavings);
  const monthlyEMI = num(answers.monthlyEMI);

  // Calculate metrics
  const actualSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? (actualSavings / monthlyIncome) * 100 : 0;
  const reportedSavingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;
  const debtRatio = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) * 100 : 0;

  // Generate insights
  const insights = [];

  // Savings insights
  if (savingsRate >= 20) {
    insights.push({
      title: 'Excellent Savings Rate',
      text: `Your savings rate of ${savingsRate.toFixed(1)}% is excellent! You're saving ₹${actualSavings.toLocaleString()} monthly. Consider diversifying into SIPs and tax-saving instruments to maximize growth.`,
      color: 'insight-success',
      priority: 1
    });
  } else if (savingsRate >= 10) {
    insights.push({
      title: 'Good Savings Habit',
      text: `You're saving ${savingsRate.toFixed(1)}% of income (₹${actualSavings.toLocaleString()}/month). Aim for 20%+ by identifying and reducing discretionary spending in categories like ${answers.variableExpenses?.slice(0, 2).join(' and ') || 'entertainment'}.`,
      color: 'insight-warning',
      priority: 2
    });
  } else {
    insights.push({
      title: 'Savings Need Attention',
      text: `Current savings rate is ${savingsRate.toFixed(1)}%. Start by setting aside just 10% automatically after payday. Small consistent steps build strong financial foundations.`,
      color: 'insight-danger',
      priority: 3
    });
  }

  // Expense insights
  if (expenseRatio > 80) {
    insights.push({
      title: 'High Expense Ratio',
      text: `Expenses consume ${expenseRatio.toFixed(1)}% of income. Focus on reducing variable costs like ${answers.variableExpenses?.slice(0, 2).join(', ') || 'shopping and dining'}. Track daily spending for 30 days to identify saving opportunities.`,
      color: 'insight-danger',
      priority: 3
    });
  } else if (expenseRatio > 60) {
    insights.push({
      title: 'Moderate Expense Control',
      text: `Expenses at ${expenseRatio.toFixed(1)}% leave limited room for savings. Review fixed costs like ${answers.fixedExpenses?.slice(0, 2).join(', ') || 'subscriptions and utilities'} for optimization opportunities.`,
      color: 'insight-warning',
      priority: 2
    });
  } else {
    insights.push({
      title: 'Well-Managed Expenses',
      text: `Your expense ratio of ${expenseRatio.toFixed(1)}% indicates good financial discipline. Continue this balanced approach and redirect surplus toward wealth-building investments.`,
      color: 'insight-success',
      priority: 1
    });
  }

  // Debt insights
  if (answers.hasLoans === 'Yes') {
    if (debtRatio >= 40) {
      insights.push({
        title: 'High Debt Burden',
        text: `EMIs consume ${debtRatio.toFixed(1)}% of income (₹${monthlyEMI.toLocaleString()}/month). Prioritize prepaying high-interest loans and avoid new debt. Consider debt consolidation if rates vary significantly.`,
        color: 'insight-danger',
        priority: 3
      });
    } else if (debtRatio >= 20) {
      insights.push({
        title: 'Manageable Debt Level',
        text: `EMIs at ${debtRatio.toFixed(1)}% are manageable. Maintain a 3-6 month emergency fund and make occasional prepayments when possible to reduce interest burden.`,
        color: 'insight-warning',
        priority: 2
      });
    } else {
      insights.push({
        title: 'Low Debt Burden',
        text: `Your EMI burden of ${debtRatio.toFixed(1)}% is comfortable. If you have surplus funds, consider accelerating loan repayment to save on interest while maintaining investment discipline.`,
        color: 'insight-success',
        priority: 1
      });
    }
  } else {
    insights.push({
      title: 'Debt-Free Advantage',
      text: 'Being debt-free is a significant advantage! Channel this flexibility into building wealth through diversified investments aligned with your financial goals.',
      color: 'insight-success',
      priority: 1
    });
  }

  // Emergency fund
  const emergencyMonths = 6;
  const emergencyTarget = monthlyExpense * emergencyMonths;
  insights.push({
    title: 'Emergency Fund Target',
    text: `Build an emergency fund of ₹${Math.round(emergencyTarget).toLocaleString()} (${emergencyMonths} months of expenses). Keep this in liquid/savings accounts or short-term FDs for easy access during emergencies.`,
    color: 'insight-info',
    priority: 2
  });

  // Investment guidance
  if (answers.hasInvestments === 'Yes' && answers.investmentTypes?.length > 0) {
    insights.push({
      title: 'Portfolio Optimization',
      text: `You're investing in ${answers.investmentTypes.join(', ')}. Ensure proper asset allocation: 60-70% equity funds for long-term goals, 20-30% debt instruments for stability, and 10% in liquid funds for short-term needs.`,
      color: 'insight-info',
      priority: 2
    });
  } else {
    insights.push({
      title: 'Start Your Investment Journey',
      text: 'Begin investing with a simple approach: Start a SIP in a diversified equity mutual fund with ₹5,000-10,000 monthly. Automate investments on salary day to build wealth consistently.',
      color: 'insight-info',
      priority: 2
    });
  }

  // Sort insights by priority
  insights.sort((a, b) => a.priority - b.priority);

  return (
    <div className="questions-container">
      <div className="questions-header">
        <button className="back-button" onClick={onBackToDashboard}>
          <span className="back-arrow">←</span> Back to Dashboard
        </button>
        <h1>Your Financial Analysis</h1>
        <p>AI-powered insights based on your financial profile</p>
      </div>

      <div className="button-container">
        <button 
          className={`premium-tab-button ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <span className="tab-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
            </svg>
          </span>
          <span className="tab-text">Insights</span>
        </button>
        <button 
          className={`premium-tab-button ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          <span className="tab-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </span>
          <span className="tab-text">Charts</span>
        </button>
        <button 
          className={`premium-tab-button ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <span className="tab-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </span>
          <span className="tab-text">Goals</span>
        </button>
      </div>

      <div className="question-card">
        <div className="result-header">
          <div className="result-title">
            <div className="ai-badge">
              <span className="ai-icon">✨</span>
              <span>AI Analysis</span>
            </div>
            <div>
              <h2>Financial Health Overview</h2>
              <p className="income-expense-summary">
                Monthly: <span className="income-highlight">₹{monthlyIncome.toLocaleString()}</span> income • 
                <span className="expense-highlight">₹{monthlyExpense.toLocaleString()}</span> expenses • 
                <span className="savings-highlight">₹{actualSavings.toLocaleString()}</span> surplus
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'insights' && (
          <div className="tab-content">
            <div className="insights-header">
              <h3>Personalized Recommendations</h3>
              <p>Based on your financial profile and spending patterns</p>
            </div>
            <div className="insights-grid">
              {insights.map((ins, idx) => (
                <div key={idx} className={`insight-card ${ins.color}`} style={{animationDelay: `${idx * 0.1}s`}}>
                  <div className="insight-header">
                    <div className="insight-icon">
                      {insightIcons[ins.color] || '💡'}
                    </div>
                    <div className="insight-title">{ins.title}</div>
                  </div>
                  <div className="insight-content">{ins.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="tab-content">
            <FinancialCharts answers={answers} />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="tab-content">
            {(answers.shortTermGoals?.trim() || answers.longTermGoals?.trim()) ? (
              <div className="goals-section">
                <div className="goals-header">
                  <h3>Your Financial Goals</h3>
                  <p>Stay focused on what matters most to you</p>
                </div>
                <div className="goals-grid">
                  {answers.shortTermGoals && (
                    <div className="goal-card short-term fade-in">
                      <div className="goal-header">
                        <div className="goal-icon">🎯</div>
                        <div className="goal-meta">
                          <span className="goal-label">Short-Term Goal</span>
                          <span className="goal-timeline">1-3 Years</span>
                        </div>
                      </div>
                      <div className="goal-content">
                        <p className="goal-description">{answers.shortTermGoals}</p>
                        <div className="goal-recommendations">
                          <h4>Recommended Strategy:</h4>
                          <ul>
                            <li>Keep funds in liquid debt funds or FDs</li>
                            <li>Target 6-8% annual returns</li>
                            <li>Avoid equity exposure for near-term needs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {answers.longTermGoals && (
                    <div className="goal-card long-term fade-in" style={{ animationDelay: '0.1s' }}>
                      <div className="goal-header">
                        <div className="goal-icon">🏔️</div>
                        <div className="goal-meta">
                          <span className="goal-label">Long-Term Goal</span>
                          <span className="goal-timeline">5+ Years</span>
                        </div>
                      </div>
                      <div className="goal-content">
                        <p className="goal-description">{answers.longTermGoals}</p>
                        <div className="goal-recommendations">
                          <h4>Recommended Strategy:</h4>
                          <ul>
                            <li>Start SIPs in diversified equity funds</li>
                            <li>Target 12-15% annual returns</li>
                            <li>Stay invested through market cycles</li>
                            <li>Review and rebalance annually</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="action-items fade-in" style={{ animationDelay: '0.2s' }}>
                  <h4>Next Steps:</h4>
                  <div className="action-grid">
                    <div className="action-item">
                      <span className="action-number">1</span>
                      <div className="action-text">
                        <strong>Set up automatic transfers</strong>
                        <p>Automate savings on your salary day.</p>
                      </div>
                    </div>
                    <div className="action-item">
                      <span className="action-number">2</span>
                      <div className="action-text">
                        <strong>Open investment accounts</strong>
                        <p>Begin with mutual fund SIPs for your goals.</p>
                      </div>
                    </div>
                    <div className="action-item">
                      <span className="action-number">3</span>
                      <div className="action-text">
                        <strong>Track monthly progress</strong>
                        <p>Use our tracker to review spending and adjust.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-goals">
                <div className="no-goals-icon">🎯</div>
                <h3>No Goals Set Yet</h3>
                <p>Setting clear financial goals helps you stay motivated and track your progress effectively.</p>
                <button className="premium-tab-button active" style={{border: 'none'}} onClick={() => navigate('/income-expense-questions')}>
                  Set Your Goals
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseResult;