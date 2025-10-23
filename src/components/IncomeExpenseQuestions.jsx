import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './IncomeExpenseQuestions.css';

const questions = [
  {
    id: 'age',
    question: "What is your age?",
    type: 'number',
    category: 'Personal Profile',
    placeholder: 'e.g., 30'
  },
  {
    id: 'occupation',
    question: "What is your occupation/employment type?",
    type: 'select',
    options: ['Salaried', 'Self-employed', 'Business', 'Student', 'Retired'],
    category: 'Personal Profile'
  },
  {
    id: 'monthlyIncome',
    question: "What is your monthly income (approx.)?",
    type: 'number',
    category: 'Income Details',
    placeholder: 'e.g., 50000'
  },
  {
    id: 'hasMultipleIncome',
    question: "Do you have multiple income sources?",
    type: 'select',
    options: ['Yes', 'No'],
    category: 'Income Details'
  },
  {
    id: 'otherIncomeSources',
    question: "Select your other income sources:",
    type: 'multiSelect',
    options: ['Rent', 'Freelance', 'Dividends', 'Business', 'Other'],
    category: 'Income Details',
    condition: (formData) => formData.hasMultipleIncome === 'Yes'
  },
  {
    id: 'monthlyExpense',
    question: "What is your average monthly expense (approx.)?",
    type: 'number',
    category: 'Expense Details',
    placeholder: 'e.g., 35000'
  },
  {
    id: 'fixedExpenses',
    question: "What are your major fixed expenses?",
    type: 'multiSelect',
    options: ['Rent/Mortgage', 'EMI', 'Utilities', 'Insurance', 'Subscriptions', 'Other'],
    category: 'Expense Details'
  },
  {
    id: 'variableExpenses',
    question: "What are your major variable expenses?",
    type: 'multiSelect',
    options: ['Food', 'Shopping', 'Travel', 'Entertainment', 'Healthcare', 'Other'],
    category: 'Expense Details'
  },
  {
    id: 'currentlySaving',
    question: "Do you currently save a part of your income?",
    type: 'select',
    options: ['Yes', 'No'],
    category: 'Savings'
  },
  {
    id: 'monthlySavings',
    question: "Approx. how much do you save per month?",
    type: 'number',
    category: 'Savings',
    placeholder: 'e.g., 10000',
    condition: (formData) => formData.currentlySaving === 'Yes'
  },
  {
    id: 'hasLoans',
    question: "Do you have any loans?",
    type: 'select',
    options: ['Yes', 'No'],
    category: 'Debt / Liabilities'
  },
  {
    id: 'monthlyEMI',
    question: "What is your total monthly EMI amount?",
    type: 'number',
    category: 'Debt / Liabilities',
    placeholder: 'e.g., 15000',
    condition: (formData) => formData.hasLoans === 'Yes'
  },
  {
    id: 'shortTermGoals',
    question: "What are your short-term financial goals? (1-3 years)",
    type: 'text',
    category: 'Financial Goals',
    placeholder: 'e.g., Save for vacation, buy a car'
  },
  {
    id: 'longTermGoals',
    question: "What are your long-term financial goals? (5+ years)",
    type: 'text',
    category: 'Financial Goals',
    placeholder: 'e.g., Retirement planning, buying a house, kids education'
  }
];

const categories = [
  'Personal Profile',
  'Income Details',
  'Expense Details',
  'Savings',
  'Debt / Liabilities',
  'Financial Goals'
];

const steps = categories.map((cat) => ({
  title: cat,
  fields: questions.filter(q => q.category === cat)
}));

const getCategoryColor = (category) => {
  const colors = {
    'Personal Profile': 'category-blue',
    'Income Details': 'category-green',
    'Expense Details': 'category-red',
    'Savings': 'category-purple',
    'Debt / Liabilities': 'category-orange',
    'Financial Goals': 'category-indigo'
  };
  return colors[category] || 'category-gray';
};

const getCategoryIcon = (category) => {
  const icons = {
    'Personal Profile': '👤',
    'Income Details': '💰',
    'Expense Details': '💳',
    'Savings': '🏦',
    'Debt / Liabilities': '🏠',
    'Financial Goals': '🎯'
  };
  return icons[category] || '📋';
};

const IncomeExpenseQuestions = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    occupation: '',
    monthlyIncome: '',
    hasMultipleIncome: '',
    otherIncomeSources: [],
    monthlyExpense: '',
    fixedExpenses: [],
    variableExpenses: [],
    currentlySaving: '',
    monthlySavings: '',
    hasLoans: '',
    monthlyEMI: '',
    shortTermGoals: '',
    longTermGoals: ''
  });

  const isFieldVisible = (field) => {
    return !field.condition || field.condition(formData);
  };

  const isStepValid = (stepIndex) => {
    const step = steps[stepIndex];
    return step.fields.every((f) => {
      if (!isFieldVisible(f)) return true;
      const val = formData[f.id];
      if (f.type === 'multiSelect') {
        return true; // Multi-select can be optional or have validation logic here
      }
      if (f.type === 'text') {
        return val !== undefined && val !== null && String(val).trim() !== '';
      }
      if (f.type === 'number') {
        return val !== '' && !isNaN(parseFloat(val));
      }
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
  };

  const setValue = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const goNext = () => {
    if (isStepValid(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(s => s + 1);
      } else {
        setIsCompleted(true);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const getProgressPercentage = () => {
    const stepForProgress = isCompleted ? steps.length : currentStep + 1;
    return (stepForProgress / steps.length) * 100;
  };

  const onBackToDashboard = () => {
    navigate('/');
  };

  const onSubmit = (data) => {
    navigate('/income-expense-results', { state: { answers: data } });
  };

  return (
    <div className="questions-container">
      <header className="questions-header tracker-header">
        <button className="tracker-back" onClick={onBackToDashboard} aria-label="Back to Dashboard">
          <span className="back-arrow">←</span> Back to Dashboard
        </button>
      </header>

      <section className="progress-container" aria-label="Progress" role="region">
        <div className="progress-bar" role="progressbar" aria-valuenow={getProgressPercentage()} aria-valuemin="0" aria-valuemax="100" aria-label="Form completion progress">
          <div 
            className="progress-fill" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="progress-info">
          <div className="progress-text">
            {isCompleted ? '✓ All steps completed' : `Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep].title}`}
          </div>
          <div className="progress-percentage">
            {Math.round(getProgressPercentage())}%
          </div>
        </div>
        <div className="step-indicator" aria-label="Step indicators">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`step-dot ${index < currentStep ? 'completed' : index === currentStep ? 'active' : ''}`}
              aria-label={`Step ${index + 1} ${index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending'}`}
            ></div>
          ))}
        </div>
      </section>

      <main className="question-card">
        {!isCompleted ? (
          <div className="question-content">
            <div className="step-header">
              <span className={`category-badge ${getCategoryColor(steps[currentStep].title)}`}>
                <span className="badge-icon">{getCategoryIcon(steps[currentStep].title)}</span>
                <span className="badge-text">{steps[currentStep].title}</span>
              </span>
              <h2>Provide your details</h2>
            </div>

            <div className="form-grid">
              {steps[currentStep].fields.filter(isFieldVisible).map((field) => (
                <div key={field.id} className="field-group">
                  <label className="field-label">
                    {field.question}
                    {field.condition && <span className="optional-tag">Optional</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="form-input"
                      value={formData[field.id] || ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      aria-describedby={`${field.id}-help`}
                      aria-required={!field.condition}
                    />
                  )}
                  
                  {field.type === 'number' && (
                    <input
                      type="number"
                      className="form-input"
                      value={formData[field.id]}
                      onChange={(e) => setValue(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      aria-describedby={`${field.id}-help`}
                      aria-required={!field.condition}
                    />
                  )}
                  
                  {field.type === 'select' && (
                    <select
                      className="form-select"
                      value={formData[field.id] || ''}
                      onChange={(e) => setValue(field.id, e.target.value)}
                      aria-describedby={`${field.id}-help`}
                      aria-required={!field.condition}
                    >
                      <option value="" disabled hidden>Select an option...</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  
                  {field.type === 'multiSelect' && (
                    <div className="checkbox-group">
                      {field.options?.map(opt => {
                        const checked = Array.isArray(formData[field.id]) && formData[field.id].includes(opt);
                        const toggle = () => {
                          const currentValue = formData[field.id];
                          const curr = Array.isArray(currentValue) ? currentValue : [];
                          if (checked) setValue(field.id, curr.filter(v => v !== opt));
                          else setValue(field.id, [...curr, opt]);
                        };
                        return (
                          <label key={opt} className={`checkbox-item ${checked ? 'checked' : ''}`}>
                            <input type="checkbox" checked={checked} onChange={toggle} />
                            <span className="checkbox-label">{opt}</span>
                            {checked && <span className="check-icon">✓</span>}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="question-navigation">
              <button
                onClick={currentStep === 0 ? onBackToDashboard : goBack}
                className="btn-previous"
                aria-label={currentStep === 0 ? 'Back to Dashboard' : 'Go to previous step'}
              >
                <span className="btn-icon">←</span>
                {currentStep === 0 ? 'Back' : 'Previous'}
              </button>
              <div className="nav-buttons">
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={goNext}
                    disabled={!isStepValid(currentStep)}
                    className="btn-next"
                    aria-label={`Go to next step: ${steps[currentStep + 1].title}`}
                  >
                    Next
                    <span className="btn-icon">→</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCompleted(true)}
                    disabled={!isStepValid(currentStep)}
                    className="btn-submit"
                    aria-label="Review answers before submitting"
                  >
                    <span className="btn-icon">✓</span>
                    Review Answers
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="review-content">
            <div className="review-header">
              <div className="review-icon">📋</div>
              <h3>Review Your Answers</h3>
              <p className="review-subtitle">Please verify all information before submitting</p>
            </div>
            
            <div className="review-sections">
              {categories.map(cat => {
                const categoryFields = questions.filter(q => q.category === cat && isFieldVisible(q));
                if (categoryFields.length === 0) return null;
                
                return (
                  <div key={cat} className="review-section">
                    <div className="section-header">
                      <span className={`category-badge ${getCategoryColor(cat)}`}>
                        <span className="badge-icon">{getCategoryIcon(cat)}</span>
                        <span className="badge-text">{cat}</span>
                      </span>
                    </div>
                    <div className="section-fields">
                      {categoryFields.map(q => (
                        <div key={q.id} className="review-field">
                          <div className="field-question">{q.question}</div>
                          <div className="field-answer">
                            {Array.isArray(formData[q.id])
                              ? (formData[q.id].length ? formData[q.id].join(', ') : '—')
                              : (formData[q.id] || '—')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="review-navigation">
              <button onClick={() => setIsCompleted(false)} className="btn-previous" aria-label="Edit answers">
                <span className="btn-icon">←</span>
                Edit Answers
              </button>
              <button onClick={() => onSubmit(formData)} className="btn-submit" aria-label="Submit form and view results">
                <span className="btn-icon">✓</span>
                Submit & View Results
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IncomeExpenseQuestions;