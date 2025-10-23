import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const InvestmentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const answers = location.state?.answers;
  const [activeTab, setActiveTab] = useState('insights');
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Analyze investment profile when component mounts
    if (answers) {
      performMLAnalysis();
    }
  }, [answers]);

  const performMLAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Format data for API
      const formattedData = {
        risk_appetite: answers.riskAppetite || 'Moderate (Balance between safety and returns)',
        investment_timeframe: answers.investmentTimeframe || 'Medium-term (1-3 years)',
        monthly_investment: parseFloat(answers.investmentAmount) || 0,
        experience_level: getExperienceScore(answers.investmentUnderstanding) || 1,
        loss_tolerance: getLossToleranceScore(answers.lossReaction) || 1,
        current_investments: answers.investmentTypes || [],
        expected_returns: getExpectedReturnsScore(answers.expectedReturns) || 2,
        management_style: answers.managementStyle || 'Through a financial advisor'
      };

      // Call ML analysis API
      const response = await fetch('http://localhost:8000/analyze-investment-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      const analysis = await response.json();
      setMlAnalysis(analysis);
      
    } catch (err) {
      console.error('ML Analysis Error:', err);
      setError(err.message || 'Failed to perform investment analysis');
    } finally {
      setLoading(false);
    }
  };

  const getRiskScore = (riskAppetite) => {
    const scores = {
      'Low (Prefer safety over returns)': 1,
      'Moderate (Balance between safety and returns)': 2,
      'High (Can take risks for higher returns)': 3
    };
    return scores[riskAppetite] || 2;
  };

  const getTimeframeScore = (timeframe) => {
    const scores = {
      'Short-term (Less than 1 year)': 1,
      'Medium-term (1-3 years)': 2,
      'Long-term (More than 3 years)': 3,
      'Mix of timeframes': 2
    };
    return scores[timeframe] || 2;
  };

  const getExperienceScore = (understanding) => {
    const scores = {
      'Very well - I research thoroughly': 3,
      'Moderately - I understand the basics': 2,
      'Limited - I rely on advice': 1,
      'Not much - Need to learn more': 0
    };
    return scores[understanding] || 1;
  };

  const getLossToleranceScore = (reaction) => {
    const scores = {
      'Withdraw immediately': 0,
      'Wait and watch': 1,
      'See it as an opportunity': 2,
      'Seek professional advice': 1
    };
    return scores[reaction] || 1;
  };

  const getExpectedReturnsScore = (returns) => {
    const scores = {
      'Up to 8% (Low risk)': 1,
      '8-12% (Moderate risk)': 2,
      '12-15% (High risk)': 3,
      'Above 15% (Very high risk)': 4
    };
    return scores[returns] || 2;
  };

  const onBackToDashboard = () => {
    navigate('/');
  };

  if (!answers) {
    return (
      <div className="results-container">
        <div className="error-message">
          No investment data available. Please complete the questionnaire first.
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="header">
        <button className="back-button" onClick={onBackToDashboard}>
          <span>←</span> Back to Dashboard
        </button>
        <h1>Investment Analysis Report</h1>
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
            className={activeTab === 'recommendations' ? 'active' : ''}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations
          </button>
          <button
            className={activeTab === 'portfolio' ? 'active' : ''}
            onClick={() => setActiveTab('portfolio')}
          >
            Suggested Portfolio
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <p>Please wait while our AI analyzes your investment profile...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>Error: {error}</p>
          </div>
        ) : (
          <div className="analysis-content">
            {activeTab === 'insights' && mlAnalysis && (
              <div className="insights-grid">
                <div className="insight-card">
                  <h3>Risk Profile Analysis</h3>
                  <p>{mlAnalysis.risk_profile_description || 'Analysis not available'}</p>
                </div>
                <div className="insight-card">
                  <h3>Investment Style</h3>
                  <p>{mlAnalysis.investment_style_description || 'Analysis not available'}</p>
                </div>
                <div className="insight-card">
                  <h3>Time Horizon</h3>
                  <p>{mlAnalysis.time_horizon_analysis || 'Analysis not available'}</p>
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && mlAnalysis && mlAnalysis.recommendations && Array.isArray(mlAnalysis.recommendations) && (
              <div className="recommendations-container">
                <h2>Personalized Investment Recommendations</h2>
                <div className="recommendations-list">
                  {mlAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-card">
                      <h3>{rec.title || 'Recommendation'}</h3>
                      <p>{rec.description || 'Details not available'}</p>
                      {rec.allocation && (
                        <div className="allocation-info">
                          <span>Suggested Allocation: {rec.allocation}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && mlAnalysis && mlAnalysis.portfolio_allocation && Array.isArray(mlAnalysis.portfolio_allocation) && (
              <div className="portfolio-container">
                <h2>Recommended Portfolio Allocation</h2>
                <div className="portfolio-allocation">
                  {mlAnalysis.portfolio_allocation.map((item, index) => (
                    <div key={index} className="allocation-card">
                      <h3>{item.instrument || 'Investment Instrument'}</h3>
                      <div className="allocation-bar">
                        <div 
                          className="allocation-fill"
                          style={{ width: `${item.percentage || 0}%` }}
                        ></div>
                        <span>{item.percentage || 0}%</span>
                      </div>
                      <p>{item.rationale || 'Rationale not available'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentResult;
