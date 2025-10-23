import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DebtQuestions = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState({
    // Loan Overview
    hasLoans: '',
    loanTypes: [],
    totalDebt: '',
    
    // EMI Details
    monthlyEMI: '',
    emiToIncomeRatio: '',
    missedPayments: '',
    
    // Loan Duration
    largestLoanType: '',
    remainingDuration: '',
    remainingAmount: '',
    
    // Credit Card Usage
    useCreditCards: '',
    creditCardBehavior: '',
    outstandingCreditBalance: '',
    
    // Debt Management
    consideredRefinancing: [],
    debtStressLevel: '',
    stressReasons: [],
    debtManagementPlan: '',
    additionalRequirements: ''
  });

  const questions = [
    // Loan Overview Section
    {
      id: 'hasLoans',
      question: "Do you currently have any loans or debts?",
      type: 'radio',
      options: ['Yes', 'No'],
      category: 'Loan Overview'
    },
    {
      id: 'loanTypes',
      question: "What types of loans do you currently have?",
      type: 'multiselect',
      options: ['Home Loan', 'Personal Loan', 'Education Loan', 'Car Loan', 'Credit Card Debt', 'Business Loan'],
      category: 'Loan Overview',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'totalDebt',
      question: "What is your total outstanding debt amount?",
      type: 'number',
      category: 'Loan Overview',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },

    // EMI Details Section
    {
      id: 'monthlyEMI',
      question: "What is your total monthly EMI payment across all loans?",
      type: 'number',
      category: 'EMI Details',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'emiToIncomeRatio',
      question: "What percentage of your monthly income goes towards EMI payments?",
      type: 'select',
      options: ['Less than 20%', '20-30%', '30-40%', '40-50%', 'More than 50%'],
      category: 'EMI Details',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'missedPayments',
      question: "Have you missed any EMI payments in the last 12 months?",
      type: 'select',
      options: ['Never', '1-2 times', '3-4 times', 'More than 4 times'],
      category: 'EMI Details',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },

    // Loan Duration Section
    {
      id: 'largestLoanType',
      question: "Which of your loans has the highest outstanding amount?",
      type: 'select',
      options: ['Home Loan', 'Personal Loan', 'Education Loan', 'Car Loan', 'Credit Card Debt', 'Business Loan'],
      category: 'Loan Duration',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'remainingDuration',
      question: "How many years/months are remaining on your largest loan?",
      type: 'select',
      options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10-15 years', 'More than 15 years'],
      category: 'Loan Duration',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'remainingAmount',
      question: "What is the remaining amount on your largest loan?",
      type: 'number',
      category: 'Loan Duration',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },

    // Credit Card Usage Section
    {
      id: 'useCreditCards',
      question: "Do you use credit cards regularly?",
      type: 'radio',
      options: ['Yes', 'No'],
      category: 'Credit Card Usage'
    },
    {
      id: 'creditCardBehavior',
      question: "How do you typically handle your credit card payments?",
      type: 'select',
      options: [
        'Pay full amount every month',
        'Pay minimum amount',
        'Pay more than minimum but less than full',
        'Sometimes miss payments'
      ],
      category: 'Credit Card Usage',
      dependsOn: { id: 'useCreditCards', value: 'Yes' }
    },
    {
      id: 'outstandingCreditBalance',
      question: "What is your current outstanding credit card balance?",
      type: 'number',
      category: 'Credit Card Usage',
      dependsOn: { id: 'useCreditCards', value: 'Yes' }
    },

    // Debt Management Section
    {
      id: 'consideredRefinancing',
      question: "Have you considered or explored any of these debt management options?",
      type: 'multiselect',
      options: [
        'Debt consolidation',
        'Loan refinancing',
        'Balance transfer',
        'Debt counseling',
        'None of the above'
      ],
      category: 'Debt Management',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'debtStressLevel',
      question: "How would you rate your current stress level regarding debt management?",
      type: 'select',
      options: ['Not stressed at all', 'Slightly stressed', 'Moderately stressed', 'Very stressed', 'Extremely stressed'],
      category: 'Debt Management',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'stressReasons',
      question: "What aspects of your debt cause you the most stress?",
      type: 'multiselect',
      options: [
        'High interest rates',
        'Multiple loan payments',
        'Unpredictable income',
        'Fear of missing payments',
        'Long repayment period',
        'Impact on credit score'
      ],
      category: 'Debt Management',
      dependsOn: { id: 'debtStressLevel', value: ['Moderately stressed', 'Very stressed', 'Extremely stressed'] }
    },
    {
      id: 'debtManagementPlan',
      question: "Do you currently have a plan to manage and reduce your debt?",
      type: 'text',
      category: 'Debt Management',
      dependsOn: { id: 'hasLoans', value: 'Yes' }
    },
    {
      id: 'additionalRequirements',
      question: "Any additional requirements or concerns not covered in previous questions? Please share them here.",
      type: 'text',
      category: 'Additional Requirements'
    }
  ];

  const onBackToDashboard = () => {
    navigate('/');
  };

  const getProgressPercentage = () => {
    const totalQuestions = questions.filter(q => {
      if (q.dependsOn) {
        const dependentQuestion = formData[q.dependsOn.id];
        return dependentQuestion === q.dependsOn.value ||
          (Array.isArray(q.dependsOn.value) && q.dependsOn.value.includes(dependentQuestion));
      }
      return true;
    }).length;
    const answeredQuestions = questions.filter(q => {
      if (q.dependsOn) {
        const dependentQuestion = formData[q.dependsOn.id];
        if (!(dependentQuestion === q.dependsOn.value ||
          (Array.isArray(q.dependsOn.value) && q.dependsOn.value.includes(dependentQuestion)))) {
          return false;
        }
      }
      return formData[q.id] !== '' && formData[q.id] !== null;
    }).length;
    return (answeredQuestions / totalQuestions) * 100;
  };

  const handleInputChange = (questionId, value) => {
    const question = questions.find(q => q.id === questionId);
    if (question.type === 'multiselect') {
      // Ensure we're working with arrays for multiselect
      setFormData(prev => ({
        ...prev,
        [questionId]: Array.isArray(value) ? value : [value]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const handleSubmit = () => {
    navigate('/debt-results', { state: { answers: formData } });
  };

  const getCurrentQuestion = () => {
    return questions[currentStep];
  };

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < questions.length) {
      let foundNext = false;
      for (let i = nextStep; i < questions.length; i++) {
        const q = questions[i];
        if (!q.dependsOn || 
            (formData[q.dependsOn.id] === q.dependsOn.value) ||
            (Array.isArray(q.dependsOn.value) && q.dependsOn.value.includes(formData[q.dependsOn.id]))) {
          setCurrentStep(i);
          foundNext = true;
          break;
        }
      }
      if (!foundNext) {
        setIsCompleted(true);
      }
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      for (let i = currentStep - 1; i >= 0; i--) {
        const q = questions[i];
        if (!q.dependsOn || 
            (formData[q.dependsOn.id] === q.dependsOn.value) ||
            (Array.isArray(q.dependsOn.value) && q.dependsOn.value.includes(formData[q.dependsOn.id]))) {
          setCurrentStep(i);
          return;
        }
      }
    }
    // If no valid previous question or at first question, go back to dashboard
    onBackToDashboard();
  };

  const renderInput = () => {
    const question = getCurrentQuestion();
    if (!question) return null;

    switch (question.type) {
      case 'text':
        return (
          <textarea
            value={formData[question.id]}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-input"
            placeholder="Type your answer here"
            rows={4}
            style={{ width: '100%', padding: '10px' }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            min="0"
            value={formData[question.id] || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                handleInputChange(question.id, value);
              }
            }}
            className="form-input"
            placeholder="Enter amount"
            style={{ width: '100%', padding: '10px' }}
          />
        );

      case 'radio':
        return (
          <div className="radio-group" style={{ width: '100%' }}>
            {question.options.map((option) => (
              <label 
                key={option} 
                className="radio-item"
                style={{
                  ...optionStyle,
                  ...(formData[question.id] === option ? selectedStyle : {})
                }}
              >
                <input
                  type="radio"
                  checked={formData[question.id] === option}
                  onChange={() => handleInputChange(question.id, option)}
                  style={{ marginRight: '12px' }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'select':
        return (
          <select
            value={formData[question.id]}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-select"
          >
            <option value="">Select an option</option>
            {question.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="checkbox-group" style={{ width: '100%' }}>
            {question.options.map((option) => (
              <label 
                key={option} 
                className="checkbox-item"
                style={{
                  ...optionStyle,
                  ...(formData[question.id]?.includes(option) ? selectedStyle : {})
                }}
              >
                <input
                  type="checkbox"
                  checked={formData[question.id]?.includes(option)}
                  onChange={(e) => {
                    const currentSelections = formData[question.id] || [];
                    const newSelections = e.target.checked
                      ? [...currentSelections, option]
                      : currentSelections.filter(item => item !== option);
                    handleInputChange(question.id, newSelections);
                  }}
                  style={{ marginRight: '12px' }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (isCompleted) {
    handleSubmit();
    return null;
  }

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  };

  const selectedStyle = {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
    color: '#1a73e8',
  };

  const optionStyle = {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    marginBottom: '8px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div className="questions-container" style={containerStyle}>
      <div className="questions-header tracker-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
          <button 
            className="tracker-back" 
            onClick={onBackToDashboard}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <span style={{ fontSize: '1.2rem', marginRight: '0.3rem' }}>←</span> Back to Dashboard
          </button>
        </div>
        <h1 className="tracker-title">Debt Management Assessment</h1>
        <p className="tracker-subtitle">Analyze your debt and create a management plan</p>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <span className="progress-text">
          Question {currentStep + 1} of {questions.length} • {Math.round(getProgressPercentage())}% Complete
        </span>
      </div>

      <div className="question-card" style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div className="question-content">
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="category-badge" style={{ 
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#e8f0fe',
              color: '#1a73e8'
            }}>
              {getCurrentQuestion()?.category}
            </span>
          </div>
          <h2 className="question-text" style={{ fontSize: '24px', fontWeight: '600', color: '#202124', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            {getCurrentQuestion()?.question}
          </h2>
          {renderInput()}
          <div className="question-navigation" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
            <button 
              className="btn-previous" 
              onClick={handlePrevious}
              style={{ 
                padding: '12px 24px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                background: 'white',
                color: '#666',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '500'
              }}
            >
              ← {currentStep === 0 ? 'Back to Dashboard' : 'Previous'}
            </button>
            <button 
              className="btn-next" 
              onClick={handleNext}
              disabled={!formData[getCurrentQuestion()?.id]}
              style={{ 
                padding: '12px 32px',
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                background: formData[getCurrentQuestion()?.id] ? '#1a73e8' : '#ccc',
                color: 'white',
                cursor: formData[getCurrentQuestion()?.id] ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                boxShadow: formData[getCurrentQuestion()?.id] ? '0 2px 8px rgba(26, 115, 232, 0.3)' : 'none'
              }}
            >
              {currentStep === questions.length - 1 ? 'Complete Assessment →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtQuestions;