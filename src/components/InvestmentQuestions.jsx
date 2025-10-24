import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './InvestmentQuestions.css';

const InvestmentQuestions = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [formData, setFormData] = useState({
    // Current Investment Status
    currentlyInvesting: '',
    investmentAmount: '',

    // Investment Types
    investmentTypes: [],
    incomePercentage: '',

    // Risk Profile
    riskAppetite: '',
    lossReaction: '',

    // Investment Knowledge
    investmentUnderstanding: '',
    currentInvestments: '',

    // Time Horizon
    investmentTimeframe: '',

    // Management Preference
    managementStyle: '',

    // Experience with Losses
    investmentLosses: '',

    // Return Expectations
    expectedReturns: ''
  });

  const questions = [
    // Current Investment Status
    {
      id: 'currentlyInvesting',
      question: "Do you currently invest your money?",
      type: 'select',
      options: ['Yes', 'No'],
      category: 'Current Investment Status'
    },
    {
      id: 'investmentAmount',
      question: "How much can you invest monthly?",
      type: 'number',
      category: 'Current Investment Status'
    },

    // Investment Types
    {
      id: 'investmentTypes',
      question: "Which investment instruments do you currently use or are interested in?",
      type: 'multiSelect',
      options: ['Fixed Deposits', 'Mutual Funds', 'Stocks', 'Gold', 'Cryptocurrency', 'Real Estate'],
      category: 'Investment Types'
    },
    {
      id: 'incomePercentage',
      question: "What percentage of your monthly income do you invest/plan to invest?",
      type: 'select',
      options: ['Less than 10%', '10-20%', '20-30%', 'More than 30%'],
      category: 'Investment Types'
    },

    // Risk Profile
    {
      id: 'riskAppetite',
      question: "How would you describe your risk appetite?",
      type: 'select',
      options: ['Low (Prefer safety over returns)', 'Moderate (Balance between safety and returns)', 'High (Can take risks for higher returns)'],
      category: 'Risk Profile'
    },
    {
      id: 'lossReaction',
      question: "How would you react if your investment loses 10% value?",
      type: 'select',
      options: [
        'Withdraw immediately',
        'Wait and watch',
        'See it as an opportunity',
        'Seek professional advice'
      ],
      category: 'Risk Profile'
    },

    // Investment Knowledge
    {
      id: 'investmentUnderstanding',
      question: "How well do you understand investments?",
      type: 'select',
      options: [
        'Very well - I research thoroughly',
        'Moderately - I understand the basics',
        'Limited - I rely on advice',
        'Not much - Need to learn more'
      ],
      category: 'Investment Knowledge'
    },
    {
      id: 'currentInvestments',
      question: "Do you currently have any investments?",
      type: 'select',
      options: ['Yes', 'No'],
      category: 'Investment Knowledge'
    },

    // Time Horizon
    {
      id: 'investmentTimeframe',
      question: "What is your preferred investment timeframe?",
      type: 'select',
      options: [
        'Short-term (Less than 1 year)',
        'Medium-term (1-3 years)',
        'Long-term (More than 3 years)',
        'Mix of timeframes'
      ],
      category: 'Time Horizon'
    },

    // Management Preference
    {
      id: 'managementStyle',
      question: "How do you prefer to manage your investments?",
      type: 'select',
      options: [
        'Self-managed',
        'Through a financial advisor',
        'Mix of both',
        'Not sure yet'
      ],
      category: 'Management Preference'
    },

    // Experience with Losses
    {
      id: 'investmentLosses',
      question: "Have you experienced investment losses before?",
      type: 'select',
      options: ['Yes', 'No'],
      category: 'Experience with Losses'
    },

    // Return Expectations
    {
      id: 'expectedReturns',
      question: "What annual returns do you expect from your investments?",
      type: 'select',
      options: [
        'Up to 8% (Low risk)',
        '8-12% (Moderate risk)',
        '12-15% (High risk)',
        'Above 15% (Very high risk)'
      ],
      category: 'Return Expectations'
    }
  ];

  const categories = [
    'Current Investment Status',
    'Investment Types',
    'Risk Profile',
    'Investment Knowledge',
    'Time Horizon',
    'Management Preference',
    'Experience with Losses',
    'Return Expectations'
  ];

  const steps = categories.map(category => ({
    title: category,
    questions: questions.filter(q => q.category === category)
  }));

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[questionId]) {
      setValidationErrors(prev => ({ ...prev, [questionId]: null }));
    }
  };

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    const errors = {};

    step.questions.forEach(question => {
      const value = formData[question.id];

      if (question.type === 'select' && (!value || value === '')) {
        errors[question.id] = `${question.question.split('?')[0]} is required`;
      }

      if (question.type === 'multiSelect' && (!value || value.length === 0)) {
        errors[question.id] = 'Please select at least one option';
      }

      if (question.type === 'number') {
        if (!value || value === '') {
          errors[question.id] = 'This field is required';
        } else if (isNaN(value) || parseFloat(value) < 0) {
          errors[question.id] = 'Please enter a valid positive amount';
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsCompleted(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepValid = () => {
    const currentQuestions = steps[currentStep].questions;
    return currentQuestions.every(q => {
      const value = formData[q.id];
      if (q.type === 'select') return value && value !== '';
      if (q.type === 'multiSelect') return value && value.length > 0;
      if (q.type === 'number') return value && !isNaN(value) && parseFloat(value) >= 0;
      return true;
    });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Here you would typically make an API call to submit the data
      // For now, we'll simulate a delay and then navigate
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/investment-results', { state: { answers: data } });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load saved progress on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('investment-questionnaire-progress');
    if (savedProgress) {
      try {
        const { formData: savedData, completedSteps: savedCompleted } = JSON.parse(savedProgress);
        setFormData(savedData);
        setCompletedSteps(new Set(savedCompleted));
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, []);

  const clearProgress = () => {
    if (window.confirm('Are you sure you want to clear all saved progress? This action cannot be undone.')) {
      localStorage.removeItem('investment-questionnaire-progress');
      setFormData({
        currentlyInvesting: '',
        investmentAmount: '',
        investmentTypes: [],
        incomePercentage: '',
        riskAppetite: '',
        lossReaction: '',
        investmentUnderstanding: '',
        currentInvestments: '',
        investmentTimeframe: '',
        managementStyle: '',
        investmentLosses: '',
        expectedReturns: ''
      });
      setCompletedSteps(new Set());
      setCurrentStep(0);
      setValidationErrors({});
    }
  };

  const exportProgress = () => {
    const progressData = {
      formData,
      completedSteps: Array.from(completedSteps),
      exportDate: new Date().toISOString(),
      currentStep
    };
    const dataStr = JSON.stringify(progressData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `investment-questionnaire-progress-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getProgressPercentage = () => {
    if (isCompleted) return 100;
    const answeredQuestions = Object.values(formData).filter(val =>
      val !== '' && val !== undefined && (!Array.isArray(val) || val.length > 0)
    ).length;
    return Math.round((answeredQuestions / questions.length) * 100);
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'Current Investment Status': 'category-blue',
      'Investment Types': 'category-green',
      'Risk Profile': 'category-purple',
      'Investment Knowledge': 'category-orange',
      'Time Horizon': 'category-indigo',
      'Management Preference': 'category-red',
      'Experience with Losses': 'category-yellow',
      'Return Expectations': 'category-gray'
    };
    return colorMap[category] || 'category-blue';
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Current Investment Status': '💰',
      'Investment Types': '📊',
      'Risk Profile': '⚡',
      'Investment Knowledge': '📚',
      'Time Horizon': '⏱️',
      'Management Preference': '🎛️',
      'Experience with Losses': '📉',
      'Return Expectations': '📈'
    };
    return iconMap[category] || '📋';
  };

  const getQuestionHelpText = (question) => {
    const helpTexts = {
      'currentlyInvesting': 'This helps us understand your current investment status and experience level.',
      'investmentAmount': 'The amount you can invest monthly determines suitable investment options and risk levels.',
      'investmentTypes': 'Different investment types have varying risk levels and potential returns. Choose what interests you.',
      'incomePercentage': 'This helps determine how much you can afford to invest without affecting your lifestyle.',
      'riskAppetite': 'Your risk tolerance affects the types of investments we recommend.',
      'lossReaction': 'This shows how you handle market volatility and investment losses.',
      'investmentUnderstanding': 'Your knowledge level helps us recommend appropriate investment strategies.',
      'currentInvestments': 'Current investments affect your overall portfolio diversification.',
      'investmentTimeframe': 'Time horizon determines the types of investments that are most suitable for your goals.',
      'managementStyle': 'Choose how involved you want to be in managing your investments.',
      'investmentLosses': 'Past experience with losses helps us understand your risk tolerance.',
      'expectedReturns': 'Realistic return expectations are important for proper investment planning.'
    };

    return helpTexts[question.id] || 'Click for more information about this question.';
  };

  if (isCompleted) {
    return (
      <div className="questions-container">
        <div className="questions-header tracker-header">
          <button className="tracker-back" onClick={() => navigate('/')}>
            <span>←</span> Back to Dashboard
          </button>
          <h1 className="tracker-title">Investment Planning Complete</h1>
          <p className="tracker-subtitle">Analyzing your investment profile...</p>
        </div>
        <div className="completion-message">
          <div className="question-card">
            <h2>🎉 Thank you for completing the questionnaire!</h2>
            <p>Your personalized investment recommendations are being prepared.</p>
            {!isSubmitting ? (
              <button onClick={() => onSubmit(formData)} className="primary-button">
                View Your Investment Plan
              </button>
            ) : (
              <button disabled className="primary-button">
                <span className="loading-spinner"></span>
                Analyzing Your Profile...
              </button>
            )}
            <div style={{ marginTop: '1rem' }}>
              <small style={{ color: '#6b7280' }}>
                This analysis uses advanced ML algorithms to provide personalized recommendations
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="questions-container">
      <div className="questions-header tracker-header">
        <button className="tracker-back" onClick={() => navigate('/')}>
          <span>←</span> Back to Dashboard
        </button>
        <h1 className="tracker-title">Investment Planning</h1>
        <p className="tracker-subtitle">Let's create your personalized investment strategy</p>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="progress-text">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          {completedSteps.has(currentStep) && <span style={{ marginLeft: '0.5rem', color: '#4ade80' }}>✓</span>}
        </div>
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step-indicator ${
                index === currentStep ? 'active' :
                completedSteps.has(index) ? 'completed' : 'pending'
              }`}
              title={step.title}
            >
              {completedSteps.has(index) ? '✓' : index + 1}
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          <span>Progress: {getProgressPercentage()}%</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={exportProgress}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
              title="Export progress to file"
            >
              💾 Export
            </button>
            <button
              onClick={clearProgress}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
              title="Clear all saved progress"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-content">
          <div className="step-header">
            <span className={`category-badge ${getCategoryColor(steps[currentStep].title)}`}>
              <span className="badge-icon">{getCategoryIcon(steps[currentStep].title)}</span>
              <span className="badge-text">{steps[currentStep].title}</span>
            </span>
            <h2>Please provide the details below</h2>
          </div>

          <div className="questions-list">
            {steps[currentStep].questions.map(question => (
              <div
                key={question.id}
                className={`question-item ${completedSteps.has(currentStep) ? 'completed' : ''} ${validationErrors[question.id] ? 'error' : ''}`}
                style={{
                  display: question.condition && !question.condition() ? 'none' : 'block'
                }}
              >
                {completedSteps.has(currentStep) && (
                  <div className="completed-checkmark">✓</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <label>{question.question}</label>
                  <div
                    className="help-tooltip"
                    title={getQuestionHelpText(question)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'help',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: 'bold'
                    }}
                  >
                    ?
                  </div>
                </div>
                {question.type === 'select' && (
                  <select
                    value={formData[question.id] || ''}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                  >
                    <option value="">Select an option</option>
                    {question.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {question.type === 'multiSelect' && (
                  <div className="checkbox-group">
                    {question.options.map(opt => (
                      <label key={opt} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData[question.id]?.includes(opt) || false}
                          onChange={(e) => {
                            const currentValues = formData[question.id] || [];
                            let updatedValues;
                            if (e.target.checked) {
                              updatedValues = [...currentValues, opt];
                            } else {
                              updatedValues = currentValues.filter(item => item !== opt);
                            }
                            handleInputChange(question.id, updatedValues);
                          }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {question.type === 'number' && (
                  <input
                    type="number"
                    value={formData[question.id] || ''}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    min="0"
                    placeholder="Enter amount"
                  />
                )}
                {validationErrors[question.id] && (
                  <div className="error-message">
                    ⚠️ {validationErrors[question.id]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="button-group">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="secondary-button"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="primary-button"
            >
              {currentStep === steps.length - 1 ? 'Complete Assessment' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
 

export default InvestmentQuestions;
