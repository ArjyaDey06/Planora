import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Questionnaire.css';

const GoalBasedPlanningQuestions = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState({
    yearlyIncome: '',
    monthlyExpenses: '',
    monthlySavings: '',
    emergencyFundCurrent: '',
    hasLoans: '',
    monthlyEmi: '',
    age: '',
    riskAppetite: '',
    shortTermGoals: '',
    longTermGoals: ''
  });
  const [errors, setErrors] = useState({});

  const questions = [
    {
      id: 'yearlyIncome',
      title: 'Your Yearly Income',
      question: 'What is your total yearly income?',
      placeholder: 'e.g., 600000',
      type: 'number'
    },
    {
      id: 'monthlyExpenses',
      title: 'Monthly Expenses',
      question: 'What are your average monthly expenses?',
      placeholder: 'e.g., 30000',
      type: 'number'
    },
    {
      id: 'monthlySavings',
      title: 'Monthly Savings',
      question: 'How much do you save each month on average?',
      placeholder: 'e.g., 10000',
      type: 'number'
    },
    {
      id: 'emergencyFundCurrent',
      title: 'Current Emergency Fund',
      question: 'How much do you currently have in your emergency fund?',
      placeholder: 'e.g., 50000',
      type: 'number'
    },
    {
      id: 'hasLoans',
      title: 'Existing Loans',
      question: 'Do you currently have any loans?',
      placeholder: '',
      type: 'select',
      options: ['Yes', 'No']
    },
    {
      id: 'monthlyEmi',
      title: 'Monthly EMI Payments',
      question: 'What is your total monthly EMI payment across loans?',
      placeholder: 'e.g., 12000',
      type: 'number'
    },
    {
      id: 'age',
      title: 'Age',
      question: 'What is your age?',
      placeholder: 'e.g., 30',
      type: 'number'
    },
    {
      id: 'riskAppetite',
      title: 'Risk Appetite',
      question: 'How would you describe your risk appetite?',
      placeholder: '',
      type: 'select',
      options: ['Conservative', 'Moderate', 'Aggressive']
    },
    {
      id: 'shortTermGoals',
      title: 'Short-term Goals (1–3 years)',
      question: 'What are your short-term goals?',
      placeholder: 'e.g., build emergency fund, buy a bike, short trip, upskilling',
      type: 'textarea'
    },
    {
      id: 'longTermGoals',
      title: 'Long-term Goals (3+ years)',
      question: 'What are your long-term goals?',
      placeholder: 'e.g., home down payment, children’s education, retirement corpus',
      type: 'textarea'
    }
  ];

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const validateCurrentQuestion = () => {
    const question = questions[currentQuestion];
    const value = formData[question.id];
    // Skip debt fields if no loans
    if ((question.id === 'debtAmount' || question.id === 'monthlyEmi') && formData['hasLoans'] === 'No') {
      if (errors[question.id]) {
        setErrors(prev => ({ ...prev, [question.id]: '' }));
      }
      return true;
    }
    if (question.type === 'number') {
      const num = parseFloat(value);
      if (value === '' || isNaN(num) || num < 0) {
        setErrors(prev => ({ ...prev, [question.id]: 'This field is required and must be a valid number' }));
        return false;
      }
      if (question.id === 'yearlyIncome' && num <= 0) {
        setErrors(prev => ({ ...prev, [question.id]: 'Please enter a positive yearly income' }));
        return false;
      }
      if ((question.id === 'monthlyEmi') && formData['hasLoans'] === 'No') {
        return true;
      }
    } else if (question.type === 'select') {
      if (!value) {
        setErrors(prev => ({ ...prev, [question.id]: 'This field is required' }));
        return false;
      }
    } else {
      if (!formData[question.id]?.trim()) {
        setErrors(prev => ({ ...prev, [question.id]: 'This field is required' }));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentQuestion()) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    let allValid = true;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const value = formData[q.id];
      // Skip debt fields if no loans
      if ((q.id === 'debtAmount' || q.id === 'monthlyEmi') && formData['hasLoans'] === 'No') {
        if (errors[q.id]) {
          setErrors(prev => ({ ...prev, [q.id]: '' }));
        }
        continue;
      }
      if (q.type === 'number') {
        const num = parseFloat(value);
        if (value === '' || isNaN(num) || num < 0) {
          setErrors(prev => ({ ...prev, [q.id]: 'This field is required and must be a valid number' }));
          allValid = false;
        }
        if (q.id === 'yearlyIncome' && (isNaN(num) || num <= 0)) {
          setErrors(prev => ({ ...prev, [q.id]: 'Please enter a positive yearly income' }));
          allValid = false;
        }
        if ((q.id === 'monthlyEmi') && formData['hasLoans'] === 'No') {
          // Skip validation when no loans
        }
      } else if (q.type === 'select') {
        if (!value) {
          setErrors(prev => ({ ...prev, [q.id]: 'This field is required' }));
          allValid = false;
        }
      } else {
        if (!value?.trim()) {
          setErrors(prev => ({ ...prev, [q.id]: 'This field is required' }));
          allValid = false;
        }
      }
    }
    if (!allValid) {
      alert('Please answer all questions before submitting.');
      return;
    }

    // Save to session storage and navigate to results
    sessionStorage.setItem('goalBasedPlanningFormData', JSON.stringify(formData));
    navigate('/goal-based-planning/results', { state: { formData } });
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-header">
        <h1>Goal-Based Financial Planning</h1>
        <p className="questionnaire-subtitle">
          Let's understand your financial goals to create a personalized plan
        </p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="progress-text">Question {currentQuestion + 1} of {questions.length}</p>
      </div>

      <div className="questionnaire-content">
        <div className="question-card">
          <h2>{questions[currentQuestion].title}</h2>
          <p className="question-text">{questions[currentQuestion].question}</p>

          <div className="input-container">
            {questions[currentQuestion].type === 'number' ? (
              <input
                type="number"
                className={`form-textarea ${errors[questions[currentQuestion].id] ? 'error' : ''}`}
                placeholder={questions[currentQuestion].placeholder}
                value={formData[questions[currentQuestion].id] || ''}
                onChange={(e) => handleInputChange(questions[currentQuestion].id, e.target.value)}
              />
            ) : questions[currentQuestion].type === 'select' ? (
              <select
                className={`form-textarea ${errors[questions[currentQuestion].id] ? 'error' : ''}`}
                value={formData[questions[currentQuestion].id] || ''}
                onChange={(e) => handleInputChange(questions[currentQuestion].id, e.target.value)}
              >
                <option value="">Select an option</option>
                {questions[currentQuestion].options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <textarea
                className={`form-textarea ${errors[questions[currentQuestion].id] ? 'error' : ''}`}
                placeholder={questions[currentQuestion].placeholder}
                value={formData[questions[currentQuestion].id] || ''}
                onChange={(e) => handleInputChange(questions[currentQuestion].id, e.target.value)}
                rows={4}
              />
            )}
            {errors[questions[currentQuestion].id] && (
              <p className="error-message">{errors[questions[currentQuestion].id]}</p>
            )}
          </div>

          <div className="navigation-buttons">
            <button
              className="btn-secondary"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </button>
            <button className="btn-primary" onClick={handleNext}>
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalBasedPlanningQuestions;