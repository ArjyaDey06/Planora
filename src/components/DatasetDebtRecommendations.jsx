import React, { useEffect, useState } from 'react';
import { getDebtRecommendations, analyzeDebt } from '../utils/apiClient';

const num = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};

const DatasetDebtRecommendations = ({ answers }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const getMLBasedRecommendations = async () => {
      try {
        setIsAnalyzing(true);
        setError(null);

        const userData = {
          monthly_income: num(answers.monthlyIncome) || num(answers.income) || 0,
          expenses: num(answers.monthlyExpenses) || 0,
          savings: num(answers.monthlySavings) || 0,
          emergency_fund: num(answers.emergencyFund) || 0,
          debt_amount: num(answers.totalDebt) || 0,
          monthly_emi: num(answers.monthlyEMI) || 0,
          credit_score: answers.creditScore,
          missed_payments: answers.missedPayments,
          loan_types: answers.loanTypes || []
        };

        // Get ML predictions and recommendations
        const [analysis, mlRecommendations] = await Promise.all([
          analyzeDebt(userData),
          getDebtRecommendations(userData)
        ]);

        // Combine ML analysis with recommendations
        const enhancedRecommendations = {
          aiRecommendations: mlRecommendations.recommendations,
          priorityActions: mlRecommendations.priority_actions,
          riskAnalysis: {
            score: analysis.risk_score,
            category: analysis.risk_category,
            confidence: analysis.confidence_score
          },
          debtStrategy: {
            recommendations: analysis.debt_management_strategy,
            timeline: analysis.recommended_timeline,
            savingsGoal: analysis.recommended_savings
          },
          creditImprovement: mlRecommendations.credit_improvement_steps,
          additionalConsiderations: mlRecommendations.additional_considerations
        };

        setRecommendations(enhancedRecommendations);
      } catch (err) {
        console.error('Error fetching ML recommendations:', err);
        setError('Failed to get AI-powered recommendations');
      } finally {
        setIsAnalyzing(false);
        setLoading(false);
      }
    };

    if (answers) {
      getMLBasedRecommendations();
    }
  }, [answers]);

  if (loading || isAnalyzing) {
    return (
      <div className="recommendations-container">
        <div className="loading-indicator" style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '18px', color: '#1a73e8' }}>
            {isAnalyzing ? 'Analyzing your financial data...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-container">
        <div className="error-message" style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="recommendations-container">
        <p style={{ textAlign: 'center', padding: '2rem' }}>
          No recommendations available. Please provide your financial information.
        </p>
      </div>
    );
  }

  return (
    <div className="recommendations-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* AI-Powered Recommendations Section */}
      <section className="recommendation-section" style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1a73e8', marginBottom: '16px' }}>AI-Powered Recommendations</h2>
        <div className="recommendations-list">
          {recommendations.aiRecommendations.map((rec, index) => (
            <div key={index} className="recommendation-item" style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '16px', lineHeight: '1.5' }}>{rec}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Priority Actions */}
        <section className="recommendation-section" style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#1a73e8', marginBottom: '16px' }}>Priority Actions</h2>
          <div className="actions-list">
            {recommendations.priorityActions.map((action, index) => (
              <div key={index} className="action-item" style={{ 
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>{action}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Risk Analysis */}
        <section className="recommendation-section" style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#1a73e8', marginBottom: '16px' }}>Risk Analysis</h2>
          <div className="risk-details" style={{ 
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p className="risk-score" style={{ fontSize: '24px', marginBottom: '12px' }}>
              Risk Score: {recommendations.riskAnalysis.score}%
            </p>
            <p className="risk-category" style={{ fontSize: '18px', marginBottom: '8px' }}>
              Category: {recommendations.riskAnalysis.category}
            </p>
            <p className="confidence" style={{ fontSize: '16px' }}>
              Confidence: {recommendations.riskAnalysis.confidence}%
            </p>
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {/* Debt Strategy */}
        <section className="recommendation-section" style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#1a73e8', marginBottom: '16px' }}>Debt Reduction Strategy</h2>
          <div className="strategy-details">
            {recommendations.debtStrategy.recommendations.map((strategy, index) => (
              <div key={index} className="strategy-item" style={{ 
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>{strategy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Credit Improvement Steps */}
        <section className="recommendation-section" style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#1a73e8', marginBottom: '16px' }}>Credit Score Improvement</h2>
          <div className="credit-steps">
            {recommendations.creditImprovement.map((step, index) => (
              <div key={index} className="improvement-step" style={{ 
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DatasetDebtRecommendations;