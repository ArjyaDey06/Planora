import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DebtManagementCharts from './DebtManagementCharts';
import { analyzeDebt, formatDebtAnalysisData } from '../utils/apiClient';
import './DebtResult.css';

const DebtResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const answers = location.state?.answers;
  const [activeTab, setActiveTab] = useState('insights');
  const [animateMetrics, setAnimateMetrics] = useState(false);
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => setAnimateMetrics(true), 300);
    
    // Perform ML analysis
    if (answers) {
      performMLAnalysis();
    }
  }, [answers]);

  const performMLAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Format data for API
      const formattedData = formatDebtAnalysisData(answers);
      
      // Call ML analysis API
      const analysis = await analyzeDebt(formattedData);
      setMlAnalysis(analysis);
      
    } catch (err) {
      console.error('ML Analysis Error:', err);
      setError(err.message || 'Failed to perform ML analysis');
    } finally {
      setLoading(false);
    }
  };

  const onBackToDashboard = () => {
    navigate('/');
  };

  const renderMLAnalysisSummary = () => {
    if (loading) {
      return (
        <div className="ml-analysis-loading" style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #1a73e8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <h3 style={{ marginBottom: '1rem', color: '#1a73e8' }}>🤖 Analyzing Your Financial Profile</h3>
          <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
            Our AI models are processing your data to provide personalized debt analysis and recommendations...
          </p>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e9ecef',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '1rem'
          }}>
            <div style={{
              width: '60%',
              height: '100%',
              backgroundColor: '#1a73e8',
              borderRadius: '2px',
              animation: 'progress 2s ease-in-out infinite'
            }}></div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes progress {
              0% { width: 30%; }
              50% { width: 80%; }
              100% { width: 30%; }
            }
          `}</style>
        </div>
      );
    }

    if (error) {
      return (
        <div className="ml-analysis-error" style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
            <h3 style={{ margin: 0 }}>Analysis Temporarily Unavailable</h3>
          </div>
          <p style={{ marginBottom: '1rem' }}>
            We're unable to perform the ML analysis right now, but you can still view your basic debt information and general recommendations below.
          </p>
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Technical Details</summary>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#7f1d1d' }}>
              Error: {error}
            </p>
          </details>
        </div>
      );
    }

    if (!mlAnalysis) {
      return null;
    }

    return (
      <div className="ml-analysis-summary" style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        marginBottom: '2rem',
        borderLeft: '4px solid #1a73e8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📊</span>
          <h3 style={{ margin: 0, color: '#1a73e8' }}>AI-Powered Debt Analysis</h3>
          <div style={{
            marginLeft: 'auto',
            padding: '0.25rem 0.75rem',
            backgroundColor: mlAnalysis.confidence_score > 0.8 ? '#dcfce7' : mlAnalysis.confidence_score > 0.6 ? '#fef3c7' : '#fee2e2',
            color: mlAnalysis.confidence_score > 0.8 ? '#166534' : mlAnalysis.confidence_score > 0.6 ? '#92400e' : '#991b1b',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {Math.round(mlAnalysis.confidence_score * 100)}% Confidence
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Risk Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
              {(mlAnalysis.risk_score * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{mlAnalysis.risk_category}</div>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            borderLeft: '4px solid #1a73e8'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Debt Capacity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a73e8' }}>
              ₹{mlAnalysis.debt_capacity?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Recommended EMI: ₹{mlAnalysis.recommended_emi?.toLocaleString()}
            </div>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Financial Health</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
              {mlAnalysis.financial_health}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Overall Assessment
            </div>
          </div>
        </div>

        {mlAnalysis.cluster_analysis && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>
              👥 Your Financial Profile: {mlAnalysis.cluster_analysis.profile_name}
            </h4>
            <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.9rem' }}>
              {mlAnalysis.cluster_analysis.advice}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!answers) {
    return (
      <div className="questions-container">
        <div className="question-card">
          <div className="question-content">
            <div className="text-center">
              <div className="text-muted mb-4">No data to analyze.</div>
              <button onClick={onBackToDashboard} className="btn-primary">Back to Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  // Core financial metrics
  const totalDebt = num(answers.totalDebt);
  const monthlyEMI = num(answers.monthlyEMI);
  const outstandingCredit = num(answers.outstandingCreditBalance);
  const remainingAmount = num(answers.remainingAmount);

  // Derived metrics
  const totalLiabilities = totalDebt + outstandingCredit;
  const emiToIncomeRatio = parseFloat(answers.emiToIncomeRatio) || 0;
  const hasCriticalDebt = answers.debtStressLevel?.toLowerCase().includes('stressed');

  // Generate insights based on ML analysis and form data
  const insights = useMemo(() => {
    const insightsArray = [];

    if (loading) {
      insightsArray.push({
        title: 'Analyzing Your Debt Profile',
        text: 'Our AI is analyzing your financial data to provide personalized insights...',
        color: 'insight-info'
      });
    } else if (error) {
      insightsArray.push({
        title: 'Analysis Error',
        text: `Unable to perform ML analysis: ${error}. Showing basic analysis based on your responses.`,
        color: 'insight-warning'
      });

      // Fallback to basic analysis
      if (emiToIncomeRatio >= 50) {
        insightsArray.push({
          title: 'Critical Debt Burden',
          text: 'Your EMI payments exceed 50% of income. Consider debt consolidation and financial counseling immediately.',
          color: 'insight-danger'
        });
      } else if (emiToIncomeRatio >= 30) {
        insightsArray.push({
          title: 'High Debt Burden',
          text: 'EMIs consume a significant portion of your income. Look into refinancing options and debt management strategies.',
          color: 'insight-warning'
        });
      }
    } else if (mlAnalysis) {
      // ML-powered insights
      insightsArray.push({
        title: `Risk Assessment: ${mlAnalysis.risk_category}`,
        text: `Our AI model rates your debt risk at ${(mlAnalysis.risk_score * 100).toFixed(1)}%. ${mlAnalysis.risk_category === 'High Risk' ? 'Immediate action recommended.' : mlAnalysis.risk_category === 'Medium Risk' ? 'Monitor closely and take preventive measures.' : 'Your debt levels appear manageable.'}`,
        color: mlAnalysis.risk_category === 'High Risk' ? 'insight-danger' : mlAnalysis.risk_category === 'Medium Risk' ? 'insight-warning' : 'insight-success'
      });

      insightsArray.push({
        title: `Financial Health: ${mlAnalysis.financial_health}`,
        text: `Based on comprehensive analysis of your financial profile, your overall financial health is rated as ${mlAnalysis.financial_health.toLowerCase()}.`,
        color: mlAnalysis.financial_health === 'Poor' ? 'insight-danger' : mlAnalysis.financial_health === 'Average' ? 'insight-warning' : 'insight-success'
      });

      if (mlAnalysis.cluster_analysis) {
        insightsArray.push({
          title: `Profile: ${mlAnalysis.cluster_analysis.profile_name}`,
          text: mlAnalysis.cluster_analysis.advice,
          color: 'insight-info'
        });
      }
    }

    // Additional insights based on form responses
    if (answers.useCreditCards?.toLowerCase().includes('yes')) {
      if (answers.creditCardBehavior?.toLowerCase().includes('minimum') ||
          answers.creditCardBehavior?.toLowerCase().includes('miss')) {
        insightsArray.push({
          title: 'Risky Credit Card Behavior',
          text: 'Paying minimum amounts or missing payments can lead to debt traps. Prioritize clearing credit card debt and switch to full payments.',
          color: 'insight-danger'
        });
      } else if (answers.creditCardBehavior?.toLowerCase().includes('full')) {
        insightsArray.push({
          title: 'Healthy Credit Card Usage',
          text: 'You\'re managing credit cards well by paying full amounts. Keep monitoring spending and maintain this discipline.',
          color: 'insight-success'
        });
      }
    }

    // Loan Duration Insight
    if (answers.remainingDuration) {
      if (answers.remainingDuration.toLowerCase().includes('more than 15')) {
        insightsArray.push({
          title: 'Long-term Debt Commitment',
          text: 'Consider strategies to reduce the loan tenure through partial prepayments when possible.',
          color: 'insight-warning'
        });
      }
    }

    return insightsArray;
  }, [loading, error, mlAnalysis, answers, emiToIncomeRatio]);

  // Format data for charts
  const formattedAnswers = {
    ...answers,
    monthlyEMI: monthlyEMI,
    totalDebt: totalDebt,
    outstandingCreditBalance: outstandingCredit,
    remainingAmount: remainingAmount
  };

  return (
    <div className="results-container">
      <div className="header">
        <button className="back-button" onClick={onBackToDashboard}>
          <span>←</span> Back to Dashboard
        </button>
        <h1>Debt Analysis Report</h1>
      </div>

      <div className="content">
        <div className="tabs">
          <button
            className={activeTab === 'insights' ? 'active' : ''}
            onClick={() => setActiveTab('insights')}
          >
            Key Insights
          </button>
          <button
            className={activeTab === 'charts' ? 'active' : ''}
            onClick={() => setActiveTab('charts')}
          >
            Charts & Analysis
          </button>
          <button
            className={activeTab === 'recommendations' ? 'active' : ''}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations
          </button>
        </div>

        {activeTab === 'insights' && (
          <div className="insights-container">
            {/* ML Analysis Summary - Always show at top when available */}
            {mlAnalysis && renderMLAnalysisSummary()}

            {insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.color}`}>
                <h3>{insight.title}</h3>
                <p>{insight.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-container">

            {loading ? (
              <div className="recommendation-card">
                <h3>🔄 Generating AI Recommendations</h3>
                <p>Please wait while our AI analyzes your profile...</p>
              </div>
            ) : error ? (
              <div className="recommendation-card">
                <h3>⚠️ Recommendation Error</h3>
                <p>Unable to generate AI recommendations. Showing general guidance below.</p>
              </div>
            ) : mlAnalysis && mlAnalysis.recommendations ? (
              <div className="recommendation-card">
                <h3>🤖 AI-Powered Recommendations</h3>
                <ul>
                  {mlAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
                {mlAnalysis.confidence_score && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    Confidence Score: {(mlAnalysis.confidence_score * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            ) : null}

            <div className="recommendation-card">
              <h3>Priority Actions</h3>
              <ul>
                {emiToIncomeRatio > 50 && (
                  <li>Urgent: Schedule debt counseling session to restructure payments</li>
                )}
                {answers.creditCardBehavior?.toLowerCase().includes('minimum') && (
                  <li>Switch to full credit card payments to avoid compounding interest</li>
                )}
                {answers.missedPayments?.toLowerCase().includes('3-4') && (
                  <li>Set up auto-debit for all loan payments to prevent defaults</li>
                )}
                {totalLiabilities > 2000000 && (
                  <li>Review and consolidate high-interest loans</li>
                )}
                {mlAnalysis && mlAnalysis.debt_capacity && totalDebt > mlAnalysis.debt_capacity && (
                  <li>🚨 Current debt exceeds recommended capacity. Consider debt consolidation.</li>
                )}
                {mlAnalysis && mlAnalysis.recommended_emi < monthlyEMI && (
                  <li>💰 Consider refinancing to reduce EMI from ₹{monthlyEMI.toLocaleString()} to ₹{mlAnalysis.recommended_emi.toLocaleString()}</li>
                )}
              </ul>
            </div>

            <div className="recommendation-card">
              <h3>Debt Reduction Strategy</h3>
              <ul>
                <li>Follow the Debt Avalanche method: Focus on highest interest debt first</li>
                <li>Maintain an emergency fund of 3-6 months' EMIs</li>
                <li>Consider balance transfer options for credit cards</li>
                {answers.remainingDuration?.toLowerCase().includes('more than') && (
                  <li>Plan for periodic prepayments to reduce loan tenure</li>
                )}
                {mlAnalysis && mlAnalysis.cluster_analysis && (
                  <li>📊 Based on your profile ({mlAnalysis.cluster_analysis.profile_name}): {mlAnalysis.cluster_analysis.advice}</li>
                )}
              </ul>
            </div>

            <div className="recommendation-card">
              <h3>Credit Score Improvement</h3>
              <ul>
                <li>Maintain credit utilization below 30% of available limit</li>
                <li>Never miss payment due dates</li>
                <li>Avoid applying for new credit unless necessary</li>
                <li>Regularly check credit report for errors</li>
              </ul>
            </div>

            {mlAnalysis && (
              <div className="recommendation-card">
                <h3>📈 ML Analysis Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong>Risk Score:</strong> {(mlAnalysis.risk_score * 100).toFixed(1)}%<br/>
                    <strong>Risk Category:</strong> {mlAnalysis.risk_category}<br/>
                    <strong>Financial Health:</strong> {mlAnalysis.financial_health}
                  </div>
                  <div>
                    <strong>Debt Capacity:</strong> ₹{mlAnalysis.debt_capacity?.toLocaleString()}<br/>
                    <strong>Recommended EMI:</strong> ₹{mlAnalysis.recommended_emi?.toLocaleString()}<br/>
                    <strong>Confidence:</strong> {(mlAnalysis.confidence_score * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}

            {answers.additionalRequirements && (
              <div className="recommendation-card">
                <h3>Additional Considerations</h3>
                <p>{answers.additionalRequirements}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtResult;