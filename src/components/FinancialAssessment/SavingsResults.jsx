import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import MLIntegration from './MLIntegration';

// Register Chart.js components
const SavingsResults = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    allocation: true,
    charts: true,
    goals: false,
    notes: false
  });

  const handleMlPrediction = (prediction) => {
    setMlPrediction(prediction);
  };
  // Calculate allocation data only when mlPrediction is available
  const allocationData = useMemo(() => {
    if (!mlPrediction || !mlPrediction.allocations) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels = Object.keys(mlPrediction.allocations);
    const rawData = Object.values(mlPrediction.allocations);

    // Filter out NaN values and ensure all data is valid
    const validData = rawData.map(value => isNaN(value) ? 0 : value);
    const validLabels = labels.filter((_, index) => !isNaN(rawData[index]));

    // Create distinct colors for each category
    const colors = [
      '#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
    ];

    return {
      labels: validLabels,
      datasets: [
        {
          data: validData,
          backgroundColor: colors.slice(0, validLabels.length),
          hoverBackgroundColor: colors.slice(0, validLabels.length).map(color =>
            color.replace(')', ', 0.8)').replace('#', '#') + 'cc'
          ),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3
        }
      ]
    };
  }, [mlPrediction]);
  useEffect(() => {
    const data = location.state?.formData || JSON.parse(sessionStorage.getItem('savingsFormData') || 'null');
    if (data) {
      setFormData(data);
      // Save to session storage in case of page refresh
      sessionStorage.setItem('savingsFormData', JSON.stringify(data));
    } else {
      console.error('No form data available');
      navigate('/savings-emergency');
    }
  }, [location.state, navigate]);

  // Process analysis when form data is available
  useEffect(() => {
    if (!formData) return;
    
    console.log('Processing analysis with formData:', formData);
    
    try {
      const processedAnalysis = analyzeSavingsData(formData);
      console.log('Analysis completed:', processedAnalysis);
      setAnalysis(processedAnalysis);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing data:', error);
      setIsAnalyzing(false);
    }
  }, [formData, navigate]);

  const analyzeSavingsData = (data) => {
    const monthlyIncome = parseFloat(data.monthlyIncome) || 0;
    const monthlyExpenses = parseFloat(data.monthlyExpenses) || 0;
    const debtPayments = parseFloat(data.debtPayments) || 0;
    const monthlySavings = parseFloat(data.monthlySavings) || 0;
    
    const disposableIncome = monthlyIncome - monthlyExpenses - debtPayments;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    
    const analysis = {
      savingsHabits: {
        score: 0,
        feedback: '',
        tips: []
      },
      emergencyFund: {
        score: 0,
        feedback: '',
        tips: []
      },
      financialHealth: {
        score: 0,
        feedback: '',
        tips: []
      },
      overallScore: 0,
      metrics: {
        savingsRate: savingsRate.toFixed(1),
        disposableIncome: disposableIncome.toFixed(0)
      }
    };

    // Analyze Savings Habits
    if (data.saveMonthly === 'Yes, fixed amount') {
      analysis.savingsHabits.score += 35;
      analysis.savingsHabits.feedback = 'Excellent! You have consistent savings habits.';
    } else if (data.saveMonthly === 'Yes, varies') {
      analysis.savingsHabits.score += 25;
      analysis.savingsHabits.feedback = 'Good! You save regularly, though amounts vary.';
      analysis.savingsHabits.tips.push('Try to set a fixed savings amount each month for better financial planning.');
    } else if (data.saveMonthly === 'Sometimes') {
      analysis.savingsHabits.score += 10;
      analysis.savingsHabits.feedback = 'You save occasionally. Building consistency is key.';
      analysis.savingsHabits.tips.push('Set up automatic transfers to make saving a habit.');
    } else {
      analysis.savingsHabits.feedback = 'Starting a savings habit is crucial for financial security.';
      analysis.savingsHabits.tips.push('Begin with saving just 10% of your income each month.');
    }

    // Analyze savings rate
    if (savingsRate >= 20) {
      analysis.savingsHabits.score += 15;
      analysis.savingsHabits.tips.push('Your savings rate is excellent! Consider investing some for higher returns.');
    } else if (savingsRate >= 10) {
      analysis.savingsHabits.score += 10;
      analysis.savingsHabits.tips.push('Your savings rate is good. Try to gradually increase it to 20%.');
    } else if (savingsRate > 0) {
      analysis.savingsHabits.score += 5;
      analysis.savingsHabits.tips.push('Aim to increase your savings rate to at least 10-15% of income.');
    }

    // Evaluate saving strategy
    if (data.whenSave === 'Before spending - Pay yourself first') {
      analysis.savingsHabits.score += 10;
      analysis.savingsHabits.tips.push('Great strategy! Paying yourself first ensures consistent savings.');
    } else if (data.whenSave === 'After expenses') {
      analysis.savingsHabits.tips.push('Consider the "pay yourself first" approach - save before spending.');
    } else {
      analysis.savingsHabits.tips.push('Adopt a structured approach: save a fixed amount at the start of each month.');
    }

    // Analyze Emergency Fund
    const emergencyMonths = data.emergencyFundMonths || 'None';
    
    // Initialize emergency fund feedback
    if (data.hasEmergencyFund === 'Yes') {
      analysis.emergencyFund.feedback = 'Great! You have an emergency fund in place.';
      
      if (emergencyMonths === '6+ months') {
        analysis.emergencyFund.score += 50;
        analysis.emergencyFund.tips.push('Your emergency fund is excellent! You have strong financial security.');
      } else if (emergencyMonths === '3-6 months') {
        analysis.emergencyFund.score += 40;
        analysis.emergencyFund.tips.push('Your emergency fund is at a healthy level. Aim for 6 months for optimal security.');
      } else if (emergencyMonths === 'Less than 3 months') {
        analysis.emergencyFund.score += 25;
        analysis.emergencyFund.tips.push('Build your emergency fund to cover at least 3-6 months of expenses.');
      }
    } else if (data.hasEmergencyFund === 'Working on it') {
      analysis.emergencyFund.score += 15;
      analysis.emergencyFund.feedback = 'Good start on building your emergency fund!';
      analysis.emergencyFund.tips.push('Prioritize building an emergency fund covering 3-6 months of expenses.');
    } else {
      analysis.emergencyFund.feedback = 'An emergency fund is your financial safety net.';
      analysis.emergencyFund.tips.push('Start immediately by saving for 3 months of expenses as your first goal.');
    }

    // Analyze survival period
    const survivalPeriod = data.survivalPeriod || 'Less than 1 month';
    
    if (survivalPeriod === '6+ months') {
      analysis.emergencyFund.score += 10;
    } else if (survivalPeriod === '3-6 months') {
      analysis.emergencyFund.score += 7;
    } else if (survivalPeriod === '1-3 months') {
      analysis.emergencyFund.score += 3;
      analysis.emergencyFund.tips.push('Your financial runway is limited. Focus on building reserves.');
    } else {
      analysis.emergencyFund.tips.push('Critical: Build emergency savings immediately for financial security.');
    }

    // Analyze Financial Health
    if (debtPayments > 0) {
      const debtToIncomeRatio = (debtPayments / monthlyIncome) * 100;
      
      if (debtToIncomeRatio > 40) {
        analysis.financialHealth.feedback = 'Your debt payments are high relative to income.';
        analysis.financialHealth.tips.push('Consider debt consolidation or speaking with a financial advisor.');
      } else if (debtToIncomeRatio > 20) {
        analysis.financialHealth.score += 10;
        analysis.financialHealth.feedback = 'You have manageable debt levels.';
        analysis.financialHealth.tips.push('Focus on paying off high-interest debts first.');
      } else {
        analysis.financialHealth.score += 20;
        analysis.financialHealth.feedback = 'Your debt levels are under control.';
      }
    } else {
      analysis.financialHealth.score += 25;
      analysis.financialHealth.feedback = 'Excellent! You have no debt obligations.';
    }

    // Analyze biggest obstacle
    const obstacle = data.biggestObstacle;
    if (obstacle === 'Low income') {
      analysis.financialHealth.tips.push('Focus on increasing income through skill development or side hustles.');
    } else if (obstacle === 'High expenses') {
      analysis.financialHealth.tips.push('Review and categorize expenses to identify areas to cut back.');
    } else if (obstacle === 'Debt payments') {
      analysis.financialHealth.tips.push('Create a debt payoff plan using the avalanche or snowball method.');
    } else if (obstacle === 'Lack of discipline') {
      analysis.financialHealth.tips.push('Automate your savings to remove the need for manual discipline.');
    } else if (obstacle === 'Medical/unexpected costs') {
      analysis.financialHealth.tips.push('Build your emergency fund and ensure adequate insurance coverage.');
    } else if (obstacle === 'None') {
      analysis.financialHealth.score += 15;
      analysis.financialHealth.tips.push('Great! You can focus on optimizing your savings strategy.');
    }

    // Calculate overall score
    analysis.overallScore = Math.min(100, Math.round(
      (analysis.savingsHabits.score * 0.35) + 
      (analysis.emergencyFund.score * 0.45) + 
      (analysis.financialHealth.score * 0.20)
    ));

    // Overall feedback
    if (analysis.overallScore >= 80) {
      analysis.overallFeedback = 'Outstanding! You have excellent savings habits and strong financial security.';
    } else if (analysis.overallScore >= 60) {
      analysis.overallFeedback = 'Good job! You\'re on the right track with your financial planning.';
    } else if (analysis.overallScore >= 40) {
      analysis.overallFeedback = 'You\'re making progress, but there\'s significant room for improvement.';
    } else {
      analysis.overallFeedback = 'Focus on building your emergency fund and establishing consistent savings habits.';
    }

    return analysis;
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'linear-gradient(135deg, #10b981, #059669)';
    if (score >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (score >= 40) return 'linear-gradient(135deg, #ef4444, #dc2626)';
    return 'linear-gradient(135deg, #6b7280, #4b5563)';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return '#10b981, #059669, #047857';
    if (score >= 60) return '#f59e0b, #d97706, #b45309';
    if (score >= 40) return '#ef4444, #dc2626, #b91c1c';
    return '#6b7280, #4b5563, #374151';
  };

  const renderMLPrediction = () => {
    if (!mlPrediction) return null;

    return (
      <div style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            🤖
          </div>
          <h3 style={{
            fontWeight: '600',
            color: '#1f2937',
            fontSize: '1.125rem',
            margin: '0'
          }}>AI-Powered Money Allocation Recommendations</h3>
        </div>

        <p style={{ color: '#4b5563', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          Based on your financial profile, here's how we recommend allocating your monthly income:
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexDirection: 'column' }}>
          {Object.entries(mlPrediction.allocations).map(([category, percentage], index) => {
            // Validate percentage is a valid number
            const validPercentage = isNaN(percentage) ? 0 : percentage;

            return (
              <div key={category} style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  height: '8px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${validPercentage * 100}%`,
                    borderRadius: '4px',
                    background: `linear-gradient(90deg, ${['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 6]}, ${['#6366f1', '#8b5cf6', '#0891b2', '#059669', '#d97706', '#dc2626'][index % 6]})`,
                    transition: 'width 0.3s ease-out',
                    boxShadow: '0 0 10px rgba(79, 70, 229, 0.3)'
                  }}></div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontWeight: '500',
                    color: '#1f2937',
                    fontSize: '0.9rem'
                  }}>{category}</span>
                  <div style={{
                    background: `linear-gradient(135deg, ${['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 6]}, ${['#6366f1', '#8b5cf6', '#0891b2', '#059669', '#d97706', '#dc2626'][index % 6]})`,
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {isNaN(validPercentage * 100) ? '0.0' : (validPercentage * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '1.25rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderRadius: '8px',
          border: '1px solid #93c5fd',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '1.1rem' }}>📊</span>
            <h4 style={{ fontWeight: '600', color: '#1e40af', margin: '0' }}>Total Allocation Summary</h4>
          </div>
          <p style={{ margin: '0', color: '#1f2937', fontSize: '0.95rem' }}>
            <strong>{isNaN(mlPrediction.totalPercentage * 100) ? '0.0' : (mlPrediction.totalPercentage * 100).toFixed(1)}%</strong> of your income efficiently allocated
            <span style={{ color: '#059669', fontWeight: '600' }}> • Target: 100%</span>
          </p>
        </div>
      </div>
    );
  };

  // Show loading state
  if (isAnalyzing || !analysis) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ height: '60px' }}></div>
        <h1>Analyzing Your Data...</h1>
        <p>Please wait while we analyze your financial information.</p>
        <div style={{
          width: '100px',
          height: '100px',
          border: '5px solid #f3f4f6',
          borderTop: '5px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '2rem auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const totalSuggestions = 
    analysis.savingsHabits.tips.length + 
    analysis.emergencyFund.tips.length + 
    analysis.financialHealth.tips.length;

  const savingsAssessmentData = {
    labels: ['Savings Habits', 'Emergency Fund', 'Financial Health'],
    datasets: [
      {
        data: [
          analysis.savingsHabits.score,
          analysis.emergencyFund.score,
          analysis.financialHealth.score
        ],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(124, 58, 237, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgba(79, 70, 229, 1)',
          'rgba(124, 58, 237, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ height: '60px' }}></div>
      <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>Your Savings & Emergency Fund Analysis</h1>
      
      {/* ML Integration */}
      {formData && !isAnalyzing && (
        <div style={{ marginBottom: '2rem' }}>
          <MLIntegration formData={formData} onPrediction={handleMlPrediction} />
          {mlPrediction && renderMLPrediction()}
        </div>
      )}
      
      <div style={{
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        padding: '2rem',
        borderRadius: '16px',
        marginTop: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.15s ease-out',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #06b6d4)',
          borderRadius: '16px 16px 0 0'
        }}></div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: '#1f2937',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: '1.8rem',
              filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.3))'
            }}>🏆</span>
            Your Financial Health Score
          </h2>
          <div style={{
            background: getScoreBadgeColor(analysis.overallScore),
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '25px',
            fontSize: '0.9rem',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            {analysis.overallScore}/100
          </div>
        </div>

        <div style={{
          width: '100%',
          height: '40px',
          backgroundColor: '#e5e7eb',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: `${analysis.overallScore}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${getScoreGradient(analysis.overallScore)})`,
            transition: 'width 1.2s ease-out',
            position: 'relative',
            borderRadius: '20px',
            boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)'
          }}>
            <div style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: '600',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}>
              {analysis.overallScore}%
            </div>
          </div>
        </div>

        <p style={{
          color: '#4b5563',
          fontSize: '1.1rem',
          marginBottom: '1.5rem',
          lineHeight: '1.6',
          fontWeight: '500'
        }}>
          {analysis.overallFeedback}
        </p>

        <div style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '1.5rem'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '12px',
            border: '1px solid #0ea5e9',
            minWidth: '120px',
            transition: 'transform 0.1s ease-out, background-color 0.1s ease-out',
            cursor: 'default'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{
              fontSize: '0.875rem',
              color: '#0c4a6e',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              💰 Savings Rate
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#0369a1',
              textShadow: '0 1px 2px rgba(3, 105, 161, 0.2)'
            }}>
              {analysis.metrics.savingsRate}%
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            border: '1px solid #f59e0b',
            minWidth: '120px',
            transition: 'transform 0.1s ease-out, background-color 0.1s ease-out',
            cursor: 'default'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{
              fontSize: '0.875rem',
              color: '#92400e',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              💵 Monthly Disposable
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#d97706',
              textShadow: '0 1px 2px rgba(217, 119, 6, 0.2)'
            }}>
              ₹{analysis.metrics.disposableIncome}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.15s ease-out',
          cursor: 'pointer',
          border: '2px solid transparent'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1.02)';
          e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          e.target.style.borderColor = '#4f46e5';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          e.target.style.borderColor = 'transparent';
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 1px 2px rgba(79, 70, 229, 0.3))'
              }}>📊</span>
              Savings Assessment
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Interactive
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '300px' }}>
            <Bar
              data={savingsAssessmentData}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.parsed.y + '% Score';
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.15s ease-out',
          cursor: 'pointer',
          border: '2px solid transparent'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1.02)';
          e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          e.target.style.borderColor = '#4f46e5';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          e.target.style.borderColor = 'transparent';
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 1px 2px rgba(79, 70, 229, 0.3))'
              }}>🥧</span>
              Money Allocation Distribution
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Visual
            </div>
          </div>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1rem',
            fontStyle: 'italic',
            borderLeft: '3px solid #10b981',
            paddingLeft: '0.75rem'
          }}>
            Recommended monthly budget allocation
          </p>
          <div style={{
            flex: 1,
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {allocationData.labels.length > 0 ? (
              <Pie
                data={allocationData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 10,
                        font: {
                          size: 11
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.label + ': ' + (context.parsed * 100).toFixed(1) + '%';
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #4f46e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Generating recommendations...</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>AI is analyzing your financial profile</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.15s ease-out',
          cursor: 'pointer',
          border: '2px solid transparent',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1.02)';
          e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          e.target.style.borderColor = '#4f46e5';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          e.target.style.borderColor = 'transparent';
        }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #06b6d4)',
            borderRadius: '8px 8px 0 0'
          }}></div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            paddingTop: '0.5rem'
          }}>
            <span style={{
              fontSize: '1.5rem',
              filter: 'drop-shadow(0 1px 2px rgba(79, 70, 229, 0.3))'
            }}>💰</span>
            <h3 style={{ color: '#1f2937', margin: 0 }}>Money Allocation Strategy</h3>
          </div>

          <p style={{
            color: '#4b5563',
            marginBottom: '1rem',
            lineHeight: '1.6'
          }}>
            This personalized allocation is designed to optimize your financial health based on your current situation.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{
              color: '#1f2937',
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>🎯</span> Key Principles:
            </h4>
            <ul style={{
              paddingLeft: '1.5rem',
              color: '#4b5563',
              fontSize: '0.9rem',
              margin: 0
            }}>
              <li style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>●</span>
                Prioritize high-interest debt repayment first
              </li>
              <li style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#10b981', fontSize: '0.8rem' }}>●</span>
                Build emergency fund before aggressive investing
              </li>
              <li style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#3b82f6', fontSize: '0.8rem' }}>●</span>
                Maintain adequate insurance coverage
              </li>
              <li style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>●</span>
                Balance present needs with future security
              </li>
            </ul>
          </div>

          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #0ea5e9',
            borderLeft: '4px solid #0ea5e9'
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#0c4a6e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>💡</span>
              <strong>Pro Tip:</strong> Review and adjust this allocation quarterly or after major life changes.
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.15s ease-out',
          cursor: 'pointer',
          border: '2px solid transparent',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1.02)';
          e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          e.target.style.borderColor = '#4f46e5';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          e.target.style.borderColor = 'transparent';
        }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #10b981, #059669, #047857)',
            borderRadius: '8px 8px 0 0'
          }}></div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            paddingTop: '0.5rem'
          }}>
            <span style={{
              fontSize: '1.5rem',
              filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))'
            }}>📊</span>
            <h3 style={{ color: '#1f2937', margin: 0 }}>Monthly Budget Breakdown</h3>
          </div>

          <p style={{
            color: '#4b5563',
            marginBottom: '1rem',
            lineHeight: '1.6'
          }}>
            See how your income should be distributed across different expense categories.
          </p>

          {mlPrediction && Object.entries(mlPrediction.allocations).map(([category, percentage], index) => {
            // Validate percentage is a valid number
            const validPercentage = isNaN(percentage) ? 0 : percentage;
            const monthlyIncome = parseFloat(formData.monthlyIncome) || 0;
            const amount = monthlyIncome > 0 ? (monthlyIncome * validPercentage).toFixed(0) : '0';

            const categoryColors = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
            const bgColor = categoryColors[index % categoryColors.length];

            return (
              <div key={category} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                background: `linear-gradient(135deg, ${bgColor}15, ${bgColor}05)`,
                borderRadius: '8px',
                border: `1px solid ${bgColor}25`,
                transition: 'all 0.15s ease-out',
                fontSize: '0.9rem',
                transform: 'translateZ(0)', // Prevents blur during transforms
                backfaceVisibility: 'hidden' // Improves rendering performance
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateX(4px) scale(1.02)';
                e.target.style.background = `linear-gradient(135deg, ${bgColor}25, ${bgColor}10)`;
                e.target.style.boxShadow = `0 2px 8px ${bgColor}40`;
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateX(0) scale(1)';
                e.target.style.background = `linear-gradient(135deg, ${bgColor}15, ${bgColor}05)`;
                e.target.style.boxShadow = 'none';
              }}
              >
                <span style={{ color: '#4b5563', fontWeight: '500' }}>{category}:</span>
                <div style={{
                  background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`,
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  minWidth: '80px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  ₹{amount} ({isNaN(validPercentage * 100) ? '0.0' : (validPercentage * 100).toFixed(1)}%)
                </div>
              </div>
            );
          })}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            marginTop: '1rem',
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            fontSize: '0.95rem',
            fontWeight: '600',
            borderTop: '3px solid #4f46e5'
          }}>
            <span style={{ color: '#1f2937' }}>💰 Total Allocated:</span>
            <span style={{
              color: '#4f46e5',
              fontSize: '1.1rem',
              textShadow: '0 1px 2px rgba(79, 70, 229, 0.2)'
            }}>
              ₹{parseFloat(formData.monthlyIncome) || 0}
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.15s ease-out',
          cursor: 'pointer',
          border: '2px solid transparent',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1.02)';
          e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          e.target.style.borderColor = '#4f46e5';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          e.target.style.borderColor = 'transparent';
        }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #f59e0b, #d97706, #b45309)',
            borderRadius: '8px 8px 0 0'
          }}></div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            paddingTop: '0.5rem'
          }}>
            <span style={{
              fontSize: '1.5rem',
              filter: 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3))'
            }}>🎯</span>
            <h3 style={{ color: '#1f2937', margin: 0 }}>Financial Goals</h3>
          </div>

          <p style={{
            color: '#4b5563',
            marginBottom: '1rem',
            lineHeight: '1.6'
          }}>
            Based on your allocation, here are your key financial objectives:
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{
              color: '#1f2937',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>🏆</span> Primary Goals:
            </h4>
            <div style={{
              display: 'grid',
              gap: '0.5rem',
              marginLeft: '1rem'
            }}>
              {mlPrediction && mlPrediction.allocations && mlPrediction.allocations['Emergency Fund'] > 0.15 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd',
                  fontSize: '0.85rem',
                  color: '#1e40af',
                  transition: 'all 0.1s ease-out'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateX(2px)';
                  e.target.style.background = 'linear-gradient(135deg, #bfdbfe, #93c5fd)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateX(0)';
                  e.target.style.background = 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
                }}
                >
                  <span>🛡️</span>
                  <span>Build 6+ months of emergency fund</span>
                </div>
              )}
              {mlPrediction && mlPrediction.allocations && mlPrediction.allocations['Debt Payment'] > 0.1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
                  borderRadius: '6px',
                  border: '1px solid #fca5a5',
                  fontSize: '0.85rem',
                  color: '#dc2626',
                  transition: 'all 0.1s ease-out'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateX(2px)';
                  e.target.style.background = 'linear-gradient(135deg, #fecaca, #fca5a5)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateX(0)';
                  e.target.style.background = 'linear-gradient(135deg, #fef2f2, #fecaca)';
                }}
                >
                  <span>💳</span>
                  <span>Reduce high-interest debt</span>
                </div>
              )}
              {mlPrediction && mlPrediction.allocations && mlPrediction.allocations['Savings'] > 0.2 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
                  borderRadius: '6px',
                  border: '1px solid #86efac',
                  fontSize: '0.85rem',
                  color: '#166534',
                  transition: 'all 0.1s ease-out'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateX(2px)';
                  e.target.style.background = 'linear-gradient(135deg, #bbf7d0, #86efac)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateX(0)';
                  e.target.style.background = 'linear-gradient(135deg, #f0fdf4, #bbf7d0)';
                }}
                >
                  <span>💰</span>
                  <span>Increase savings rate to 20%+</span>
                </div>
              )}
              {mlPrediction && mlPrediction.allocations && mlPrediction.allocations['Investments'] > 0.15 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
                  borderRadius: '6px',
                  border: '1px solid #fde047',
                  fontSize: '0.85rem',
                  color: '#a16207',
                  transition: 'all 0.1s ease-out'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateX(2px)';
                  e.target.style.background = 'linear-gradient(135deg, #fef3c7, #fde047)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateX(0)';
                  e.target.style.background = 'linear-gradient(135deg, #fefce8, #fef3c7)';
                }}
                >
                  <span>📈</span>
                  <span>Diversify investment portfolio</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                borderRadius: '6px',
                border: '1px solid #7dd3fc',
                fontSize: '0.85rem',
                color: '#0c4a6e',
                transition: 'all 0.1s ease-out'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateX(2px)';
                e.target.style.background = 'linear-gradient(135deg, #e0f2fe, #7dd3fc)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateX(0)';
                e.target.style.background = 'linear-gradient(135deg, #f0f9ff, #e0f2fe)';
              }}
              >
                <span>🛡️</span>
                <span>Maintain adequate insurance coverage</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#fef3c7',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #f59e0b',
            borderLeft: '4px solid #f59e0b'
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>🚀</span>
              <strong>Next Steps:</strong> Set up automatic transfers for each category to ensure consistent execution.
            </p>
          </div>
        </div>
      </div>

      {formData.additionalNotes && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '2rem'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Your Notes</h3>
          <p style={{ color: '#4b5563' }}>{formData.additionalNotes}</p>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'white',
            color: '#4f46e5',
            border: '2px solid #4f46e5',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.15s ease-out',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '150px'
          }}
          onClick={() => navigate('/savings')}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f5f3ff';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔄</span>
            Retake Assessment
          </span>
        </button>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.15s ease-out',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '150px',
            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
          }}
          onClick={() => navigate('/dashboard')}
          onMouseOver={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #4338ca, #6d28d9)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(79, 70, 229, 0.2)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏠</span>
            Back to Dashboard
          </span>
        </button>
      </div>
    </div>
  );
};

export default SavingsResults;