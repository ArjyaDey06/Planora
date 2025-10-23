import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import MLIntegration from './MLIntegration';

// Register Chart.js components
Chart.register(...registerables);

const GoalBasedPlanningResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [formData, setFormData] = useState(null);

  // Goal priority visualization data
  const goalPriorityData = useMemo(() => {
    if (!formData) return { labels: [], datasets: [] };

    const goals = [
      { name: 'Emergency Fund', priority: 1 },
      { name: 'Short-term Goals', priority: 2 },
      { name: 'Medium-term Goals', priority: 3 },
      { name: 'Long-term Goals', priority: 4 },
      { name: 'Retirement', priority: 5 }
    ];

    return {
      labels: goals.map(g => g.name),
      datasets: [
        {
          label: 'Priority Level',
          data: goals.map(g => 6 - g.priority), // Invert so higher priority = higher bar
          backgroundColor: [
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  }, [formData]);

  // Goal timeline visualization data
  const goalTimelineData = useMemo(() => {
    if (!formData) return { labels: [], datasets: [] };

    const timelines = [
      { period: '0-1 Year', goals: ['Emergency Fund'] },
      { period: '1-3 Years', goals: ['Short-term Goals'] },
      { period: '3-7 Years', goals: ['Medium-term Goals'] },
      { period: '7-15 Years', goals: ['Long-term Goals'] },
      { period: '15+ Years', goals: ['Retirement'] }
    ];

    return {
      labels: timelines.map(t => t.period),
      datasets: [
        {
          label: 'Goals in Timeline',
          data: timelines.map(t => t.goals.length),
          backgroundColor: [
            '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  }, [formData]);

  useEffect(() => {
    const data = location.state?.formData || JSON.parse(sessionStorage.getItem('goalBasedPlanningFormData') || 'null');
    if (data) {
      setFormData(data);
      sessionStorage.setItem('goalBasedPlanningFormData', JSON.stringify(data));
    } else {
      console.error('No form data available');
      navigate('/goal-based-planning');
    }
  }, [location.state, navigate]);

  // Process analysis when form data is available
  useEffect(() => {
    if (!formData) return;

    console.log('Processing goal-based planning analysis with formData:', formData);

    try {
      const processedAnalysis = analyzeGoalData(formData);
      console.log('Goal analysis completed:', processedAnalysis);
      setAnalysis(processedAnalysis);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing goal data:', error);
      setIsAnalyzing(false);
    }
  }, [formData]);

  const analyzeGoalData = (data) => {
    // Extract goals from the form data
    const goals = {
      shortTerm: data.shortTermGoals?.split(',').map(g => g.trim()).filter(g => g) || [],
      mediumTerm: data.mediumTermGoals?.split(',').map(g => g.trim()).filter(g => g) || [],
      longTerm: data.longTermGoals?.split(',').map(g => g.trim()).filter(g => g) || [],
      retirement: data.retirementPlan ? [data.retirementPlan] : [],
      houseCar: data.houseCarPurchase ? [data.houseCarPurchase] : [],
      childrenEducation: data.childrenEducationWedding ? [data.childrenEducationWedding] : [],
      business: data.startBusiness ? [data.startBusiness] : [],
      travelLifestyle: data.travelLifestyleGoals ? [data.travelLifestyleGoals] : []
    };

    // Calculate goal priorities based on content analysis
    const priorities = calculateGoalPriorities(goals);

    // Generate timeline analysis
    const timelineAnalysis = generateTimelineAnalysis(goals);

    // Calculate feasibility scores
    const feasibilityScores = calculateFeasibilityScores(goals);

    return {
      goals,
      priorities,
      timelineAnalysis,
      feasibilityScores,
      recommendations: generateRecommendations(goals, priorities, feasibilityScores),
      investmentAllocation: generateInvestmentAllocation(priorities, timelineAnalysis)
    };
  };

  const calculateGoalPriorities = (goals) => {
    const priorities = {};

    // Analyze which goals are mentioned most frequently and with more detail
    Object.entries(goals).forEach(([category, goalList]) => {
      if (goalList.length > 0) {
        priorities[category] = {
          score: goalList.length * 10 + (goalList.join('').length / 10), // Simple scoring
          goals: goalList
        };
      }
    });

    // Normalize priorities to 0-100 scale
    const maxScore = Math.max(...Object.values(priorities).map(p => p.score));
    Object.keys(priorities).forEach(key => {
      priorities[key].normalizedScore = maxScore > 0 ? (priorities[key].score / maxScore) * 100 : 0;
    });

    return priorities;
  };

  const generateTimelineAnalysis = (goals) => {
    const timelines = {
      immediate: [],
      shortTerm: [],
      mediumTerm: [],
      longTerm: []
    };

    // Simple timeline categorization based on goal types
    Object.entries(goals).forEach(([category, goalList]) => {
      goalList.forEach(goal => {
        if (['emergency', 'shortTerm'].includes(category)) {
          timelines.shortTerm.push(goal);
        } else if (['houseCar', 'business'].includes(category)) {
          timelines.mediumTerm.push(goal);
        } else if (['retirement', 'childrenEducation', 'longTerm'].includes(category)) {
          timelines.longTerm.push(goal);
        } else {
          timelines.immediate.push(goal);
        }
      });
    });

    return timelines;
  };

  const calculateFeasibilityScores = (goals) => {
    const scores = {};

    Object.entries(goals).forEach(([category, goalList]) => {
      if (goalList.length > 0) {
        // Simple feasibility scoring based on goal type and detail level
        let baseScore = 50; // Base feasibility

        // Adjust based on goal type
        const adjustments = {
          retirement: 20,
          emergency: 30,
          houseCar: -10,
          business: -15,
          childrenEducation: 5,
          travelLifestyle: -5
        };

        baseScore += adjustments[category] || 0;

        // Adjust based on detail level (longer descriptions = more realistic)
        const avgLength = goalList.join('').length / goalList.length;
        if (avgLength > 100) baseScore += 20;
        else if (avgLength > 50) baseScore += 10;

        scores[category] = Math.max(0, Math.min(100, baseScore));
      }
    });

    return scores;
  };

  const generateRecommendations = (goals, priorities, feasibilityScores) => {
    const recommendations = [];

    // Analyze each goal category and provide specific recommendations
    Object.entries(goals).forEach(([category, goalList]) => {
      if (goalList.length === 0) return;

      const priority = priorities[category];
      const feasibility = feasibilityScores[category];
      const isHighPriority = priority && priority.normalizedScore > 60;
      const isHighFeasibility = feasibility > 70;
      const isLowFeasibility = feasibility < 50;

      // High priority, high feasibility goals - ready to execute
      if (isHighPriority && isHighFeasibility) {
        recommendations.push({
          type: 'high_priority',
          category,
          message: `${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} goals are well-defined and highly achievable based on your current situation.`,
          action: getSpecificAction(category, goalList, 'execute')
        });
      }

      // High priority, medium feasibility goals - need planning
      else if (isHighPriority && feasibility >= 50 && feasibility <= 70) {
        recommendations.push({
          type: 'review_priority',
          category,
          message: `${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} goals are important but need careful planning to ensure success.`,
          action: getSpecificAction(category, goalList, 'plan')
        });
      }

      // High priority, low feasibility goals - need adjustment
      else if (isHighPriority && isLowFeasibility) {
        recommendations.push({
          type: 'review_priority',
          category,
          message: `${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} goals need significant adjustments to become realistic and achievable.`,
          action: getSpecificAction(category, goalList, 'adjust')
        });
      }

      // Medium priority goals - consider timing
      else if (priority && priority.normalizedScore >= 40 && priority.normalizedScore <= 60) {
        recommendations.push({
          type: 'diversification',
          category,
          message: `${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} goals are moderately important. Consider tackling these after your high-priority goals are addressed.`,
          action: getSpecificAction(category, goalList, 'timing')
        });
      }
    });

    // Add general recommendations based on overall goal portfolio
    if (Object.keys(goals).length > 5) {
      recommendations.push({
        type: 'diversification',
        message: 'You have many goals spanning different areas. Consider creating a goal hierarchy to maintain focus and avoid spreading resources too thin.',
        action: 'Use the Eisenhower Matrix or similar framework to categorize goals by urgency and importance. Start with 2-3 most critical goals.'
      });
    }

    // Emergency fund recommendation if not present
    if (!goals.emergencyFund || goals.emergencyFund.length === 0) {
      recommendations.push({
        type: 'high_priority',
        message: 'Building an emergency fund should be your top financial priority before pursuing other goals.',
        action: 'Aim for 3-6 months of essential expenses. Set up automatic transfers of 10-15% of your income to a high-yield savings account.'
      });
    }

    // Debt consideration if mentioned
    const hasDebtGoals = goals.houseCar && goals.houseCar.some(goal => goal.toLowerCase().includes('loan') || goal.toLowerCase().includes('debt'));
    if (hasDebtGoals) {
      recommendations.push({
        type: 'review_priority',
        message: 'Major purchases involving loans require careful debt management planning.',
        action: 'Calculate total loan payments as percentage of income (should be <30%). Consider debt consolidation if multiple high-interest loans exist.'
      });
    }

    return recommendations;
  };

  const getSpecificAction = (category, goalList, actionType) => {
    const goalText = goalList.join(', ').toLowerCase();

    switch (category) {
      case 'retirement':
        if (actionType === 'execute') {
          return 'Calculate required monthly savings using retirement calculators. Set up automatic contributions to retirement accounts.';
        } else if (actionType === 'plan') {
          return 'Review current retirement savings rate and adjust to reach 10-15% of income. Consider catch-up contributions if age 50+.';
        } else {
          return 'Reassess retirement timeline and savings target. Consider working 2-3 years longer or reducing expected lifestyle in retirement.';
        }

      case 'houseCar':
        if (actionType === 'execute') {
          return 'Get pre-approved for financing. Research current market conditions and negotiate the best terms possible.';
        } else if (actionType === 'plan') {
          return 'Create a detailed purchase timeline and budget. Factor in maintenance costs (1-2% of home value annually).';
        } else {
          return 'Consider if purchasing is necessary now vs. renting/leasing. Explore more affordable alternatives or delay by 1-2 years.';
        }

      case 'childrenEducation':
        if (actionType === 'execute') {
          return 'Research 529 plans or education savings accounts. Start with smaller monthly contributions and increase over time.';
        } else if (actionType === 'plan') {
          return 'Calculate education costs including tuition inflation. Consider scholarship opportunities and financial aid options.';
        } else {
          return 'Reevaluate education expectations. Consider community college for first 2 years or in-state public universities.';
        }

      case 'business':
        if (actionType === 'execute') {
          return 'Create a detailed business plan with financial projections. Secure initial funding and start with minimum viable product.';
        } else if (actionType === 'plan') {
          return 'Conduct market research and develop a business model. Consider starting part-time while maintaining current income.';
        } else {
          return 'Reassess business viability and required investment. Consider bootstrapping or smaller-scale alternatives.';
        }

      case 'travelLifestyle':
        if (actionType === 'execute') {
          return 'Set specific travel budgets and booking timelines. Use travel rewards credit cards for point accumulation.';
        } else if (actionType === 'plan') {
          return 'Create a travel savings fund separate from emergency savings. Plan trips during off-peak seasons for cost savings.';
        } else {
          return 'Consider more affordable travel alternatives like domestic trips or using points/miles for free travel.';
        }

      default:
        if (actionType === 'execute') {
          return 'Break down into specific, measurable milestones. Set up dedicated savings account and automatic transfers.';
        } else if (actionType === 'plan') {
          return 'Create detailed budget and timeline. Identify potential obstacles and contingency plans.';
        } else {
          return 'Reevaluate scope and scale. Consider more modest versions that align better with your resources.';
        }
    }
  };

  const generateInvestmentAllocation = (priorities, timelineAnalysis) => {
    const totalGoals = Object.values(timelineAnalysis).reduce((sum, goals) => sum + goals.length, 0);

    if (totalGoals === 0) return {};

    return {
      emergencyFund: Math.round((timelineAnalysis.immediate.length / totalGoals) * 40),
      shortTerm: Math.round((timelineAnalysis.shortTerm.length / totalGoals) * 25),
      mediumTerm: Math.round((timelineAnalysis.mediumTerm.length / totalGoals) * 20),
      longTerm: Math.round((timelineAnalysis.longTerm.length / totalGoals) * 15)
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  if (isAnalyzing) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Analyzing your goals and generating personalized recommendations...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="error-container">
        <p>Error analyzing your goal data. Please try again.</p>
        <button onClick={() => navigate('/goal-based-planning')} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Goal-Based Financial Plan</h1>
        <p>Based on your responses, here's a comprehensive analysis of your financial goals</p>
      </div>

      <div className="results-content">
        {/* Goal Summary */}
        <div className="summary-section">
          <h2>Goal Summary</h2>
          <div className="goals-grid">
            {Object.entries(analysis.goals).map(([category, goals]) => (
              goals.length > 0 && (
                <div key={category} className="goal-card">
                  <h3>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                  <ul>
                    {goals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                  <div className="feasibility-score">
                    <span>Feasibility: </span>
                    <div className={`score-badge ${getScoreColor(analysis.feasibilityScores[category])}`}>
                      {Math.round(analysis.feasibilityScores[category])}%
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>Goal Priority Analysis</h3>
            <div className="chart-wrapper">
              <Bar data={goalPriorityData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-container">
            <h3>Goal Timeline Distribution</h3>
            <div className="chart-wrapper">
              <Bar data={goalTimelineData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations-section">
          <h2>AI-Powered Recommendations</h2>
          <div className="recommendations-grid">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card ${rec.type}`}>
                <div className="rec-header">
                  <h4>{rec.category?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) || 'General'}</h4>
                  <span className={`rec-type ${rec.type}`}>{rec.type.replace('_', ' ')}</span>
                </div>
                <p>{rec.message}</p>
                <div className="rec-action">
                  <strong>Action:</strong> {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Allocation */}
        <div className="investment-section">
          <h2>Recommended Investment Allocation</h2>
          <div className="allocation-summary">
            {Object.entries(analysis.investmentAllocation).map(([category, percentage]) => (
              <div key={category} className="allocation-item">
                <span className="allocation-label">
                  {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className="allocation-value">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => navigate('/goal-based-planning')} className="btn-secondary">
            Retake Assessment
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get score color
const getScoreColor = (score) => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
};

export default GoalBasedPlanningResults;
