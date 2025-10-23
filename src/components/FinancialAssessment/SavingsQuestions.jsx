import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Questionnaire.css';

const SavingsQuestions = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Financial Foundation
    monthlyIncome: '',
    monthlyExpenses: '',
    hasDebtPayments: '',
    debtAmount: '',
    
    // Savings Behavior
    saveMonthly: '',
    monthlySavings: '',
    whenSave: '',
    
    // Emergency Fund Status
    hasEmergencyFund: '',
    emergencyFundMonths: '',
    survivalMonths: '',
    biggestObstacle: '',
    
    additionalNotes: ''
  });

  const questions = [
    // Financial Foundation
    {
      id: 'monthlyIncome',
      question: 'What is your monthly income (after taxes)?',
      type: 'input',
      inputType: 'number',
      prefix: '₹',
      category: 'Financial Foundation'
    },
    {
      id: 'monthlyExpenses',
      question: 'What are your average monthly expenses?',
      type: 'input',
      inputType: 'number',
      prefix: '₹',
      category: 'Financial Foundation'
    },
    {
      id: 'hasDebtPayments',
      question: 'Do you have any monthly debt payments (EMIs)?',
      type: 'radio',
      options: ['Yes', 'No'],
      category: 'Financial Foundation'
    },
    {
      id: 'debtAmount',
      question: 'If yes, how much do you pay in EMIs each month?',
      type: 'input',
      inputType: 'number',
      prefix: '₹',
      showIf: { id: 'hasDebtPayments', value: 'Yes' },
      category: 'Financial Foundation'
    },
    
    // Savings Behavior
    {
      id: 'saveMonthly',
      question: 'Do you save money every month?',
      type: 'radio',
      options: ['Yes, fixed amount', 'Yes, varies', 'Sometimes', 'No'],
      category: 'Savings Behavior'
    },
    {
      id: 'monthlySavings',
      question: 'Approximately how much do you save per month?',
      type: 'input',
      inputType: 'number',
      prefix: '₹',
      showIf: { id: 'saveMonthly', value: ['Yes, fixed amount', 'Yes, varies'] },
      category: 'Savings Behavior'
    },
    {
      id: 'whenSave',
      question: 'When do you save?',
      type: 'radio',
      options: [
        'Before spending - Pay yourself first',
        'After expenses',
        'Whatever is left'
      ],
      category: 'Savings Behavior',
      showIf: { id: 'saveMonthly', value: ['Yes, fixed amount', 'Yes, varies', 'Sometimes'] }
    },
    
    // Emergency Fund Status
    {
      id: 'hasEmergencyFund',
      question: 'Do you have a separate emergency fund?',
      type: 'radio',
      options: ['Yes', 'Working on it', 'No'],
      category: 'Emergency Fund Status'
    },
    {
      id: 'emergencyFundMonths',
      question: 'How many months of expenses can your emergency fund cover?',
      type: 'radio',
      options: ['None', 'Less than 3 months', '3-6 months', '6+ months'],
      showIf: { id: 'hasEmergencyFund', value: ['Yes', 'Working on it'] },
      category: 'Emergency Fund Status'
    },
    {
      id: 'survivalMonths',
      question: 'If you lost your income tomorrow, how long could you survive on your current savings?',
      type: 'radio',
      options: [
        'Less than 1 month',
        '1-3 months',
        '3-6 months',
        '6+ months'
      ],
      category: 'Emergency Fund Status'
    },
    {
      id: 'biggestObstacle',
      question: 'What\'s your biggest obstacle to saving more?',
      type: 'radio',
      options: [
        'Low income',
        'High expenses',
        'Debt payments',
        'Lack of discipline',
        'Medical/unexpected costs',
        'None'
      ],
      category: 'Emergency Fund Status'
    },
    
    // Additional Notes
    {
      id: 'additionalNotes',
      question: 'Any additional notes about your financial situation?',
      type: 'textarea',
      category: 'Additional Information',
      optional: true
    }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const currentValues = [...(formData[name] || [])];
      if (checked) {
        currentValues.push(value);
      } else {
        const index = currentValues.indexOf(value);
        if (index > -1) {
          currentValues.splice(index, 1);
        }
      }
      setFormData({ ...formData, [name]: currentValues });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Log the form data for debugging
    console.log('Form submitted:', formData);
    
    // Ensure all required fields are filled
    const requiredFields = ['monthlyIncome', 'monthlyExpenses', 'hasDebtPayments', 'saveMonthly'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      alert('Please fill in all required fields before submitting.');
      return;
    }
    
    try {
      // Save form data to session storage as a fallback
      sessionStorage.setItem('savingsFormData', JSON.stringify(formData));
      
      // Navigate to results page with form data
      navigate('/savings-emergency-results', { 
        state: { formData },
        replace: true // Prevent going back to the form using browser back button
      });
    } catch (error) {
      console.error('Error saving form data:', error);
      alert('An error occurred while processing your form. Please try again.');
    }
  };

  const currentQuestion = questions[currentStep];
  const showPrevious = currentStep > 0;
  const isLastQuestion = currentStep === questions.length - 1;
  
  // Check if current question should be shown based on conditions
  if (currentQuestion.showIf) {
    const { id, value } = currentQuestion.showIf;
    if (formData[id] !== value) {
      // Skip this question and move to next
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
        return null;
      }
    }
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'radio':
        return (
          <div className="radio-group">
            {currentQuestion.options.map((option) => (
              <label key={option} className="radio-option">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={formData[currentQuestion.id] === option}
                  onChange={handleInputChange}
                  className="radio-input"
                />
                <span className="radio-custom"></span>
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'multiselect':
        return (
          <div className="checkbox-group">
            {currentQuestion.options.map((option) => (
              <label key={option} className="checkbox-option">
                <input
                  type="checkbox"
                  name={currentQuestion.id}
                  value={option}
                  checked={formData[currentQuestion.id]?.includes(option) || false}
                  onChange={handleInputChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'input':
        return (
          <div className="input-group">
            {currentQuestion.prefix && <span className="input-prefix">{currentQuestion.prefix}</span>}
            <input
              type={currentQuestion.inputType || 'text'}
              name={currentQuestion.id}
              value={formData[currentQuestion.id] || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder={`Enter ${currentQuestion.id.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <textarea
            name={currentQuestion.id}
            value={formData[currentQuestion.id] || ''}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder="Share any additional details..."
            rows={4}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="questionnaire-container">
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
      
      <form onSubmit={handleSubmit} className="questionnaire-form">
        <div className="question-category">{currentQuestion.category}</div>
        <h2 className="question-text">{currentQuestion.question}</h2>
        
        <div className="question-content">
          {renderQuestion()}
        </div>
        
        <div className="navigation-buttons">
          {showPrevious && (
            <button 
              type="button" 
              onClick={handleBack}
              className="btn btn-secondary"
            >
              Back
            </button>
          )}
          
          {!isLastQuestion ? (
            <button 
              type="button" 
              onClick={handleNext}
              className="btn btn-primary"
              disabled={!formData[currentQuestion.id] || 
                       (Array.isArray(formData[currentQuestion.id]) && 
                        formData[currentQuestion.id].length === 0)}
            >
              Next
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Get Analysis
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SavingsQuestions;
