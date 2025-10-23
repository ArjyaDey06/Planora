import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Questionnaire.css';

const GoalBasedPlanningQuestions = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState({
    shortTermGoals: '',
    mediumTermGoals: '',
    longTermGoals: '',
    retirementPlan: '',
    houseCarPurchase: '',
    childrenEducationWedding: '',
    startBusiness: '',
    travelLifestyleGoals: '',
    goalPriorities: '',
    goalTimelines: ''
  });
  const [errors, setErrors] = useState({});

  const questions = [
    {
      id: 'shortTermGoals',
      title: 'Short-term Goals (1–3 years)',
      question: 'What are your short-term goals?',
      placeholder: 'e.g., Emergency fund, vacation, gadgets, courses, etc.',
      type: 'textarea'
    },
    {
      id: 'mediumTermGoals',
      title: 'Medium-term Goals (3–7 years)',
      question: 'What are your medium-term goals?',
      placeholder: 'e.g., Car purchase, home down payment, career advancement, etc.',
      type: 'textarea'
    },
    {
      id: 'longTermGoals',
      title: 'Long-term Goals (7+ years)',
      question: 'What are your long-term goals?',
      placeholder: 'e.g., Retirement, children\'s education, wealth creation, etc.',
      type: 'textarea'
    },
    {
      id: 'retirementPlan',
      title: 'Retirement Planning',
      question: 'Do you have a retirement plan in mind?',
      placeholder: 'Describe your retirement goals, expected age, lifestyle, etc.',
      type: 'textarea'
    },
    {
      id: 'houseCarPurchase',
      title: 'Major Purchases',
      question: 'Do you want to buy a house/car in the future?',
      placeholder: 'Specify type, timeline, budget, location preferences, etc.',
      type: 'textarea'
    },
    {
      id: 'childrenEducationWedding',
      title: 'Family Goals',
      question: 'Do you want to save for children\'s education/wedding?',
      placeholder: 'Number of children, education level, wedding plans, etc.',
      type: 'textarea'
    },
    {
      id: 'startBusiness',
      title: 'Business/Entrepreneurship',
      question: 'Do you plan to start a business?',
      placeholder: 'Business type, investment needed, timeline, etc.',
      type: 'textarea'
    },
    {
      id: 'travelLifestyleGoals',
      title: 'Travel & Lifestyle',
      question: 'Do you want to travel or pursue lifestyle goals?',
      placeholder: 'Travel destinations, frequency, lifestyle upgrades, etc.',
      type: 'textarea'
    },
    {
      id: 'goalPriorities',
      title: 'Goal Priorities',
      question: 'How do you prioritize these goals?',
      placeholder: 'Rank your goals by importance (1 being highest priority)',
      type: 'textarea'
    },
    {
      id: 'goalTimelines',
      title: 'Goal Timelines',
      question: 'What timeline do you have in mind for each?',
      placeholder: 'Specify timeframes for each goal mentioned above',
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
    if (!formData[question.id]?.trim()) {
      setErrors(prev => ({
        ...prev,
        [question.id]: 'This field is required'
      }));
      return false;
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
    // Validate all questions before submitting
    const allValid = questions.every(q => formData[q.id]?.trim());
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
            <textarea
              className={`form-textarea ${errors[questions[currentQuestion].id] ? 'error' : ''}`}
              placeholder={questions[currentQuestion].placeholder}
              value={formData[questions[currentQuestion].id] || ''}
              onChange={(e) => handleInputChange(questions[currentQuestion].id, e.target.value)}
              rows={4}
            />
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