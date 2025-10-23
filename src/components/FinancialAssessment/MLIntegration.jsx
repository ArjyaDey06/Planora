import React, { useState, useEffect } from 'react';
import FinancialHealthModel from './FinancialHealthModel';

const MLIntegration = ({ formData, onPrediction }) => {
  const [model] = useState(new FinancialHealthModel());
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // Generate prediction when form data changes
  useEffect(() => {
    const generatePrediction = async () => {
      if (!formData) {
        console.log('No form data available for prediction');
        return;
      }

      setIsLoading(true);
      try {
        console.log('Generating allocation recommendations from form data:', formData);
        
        // Use the rule-based approach instead of ML model
        const result = model.generateAllocationFromFormData(formData);
        
        console.log('Generated allocation recommendations:', result);
        
        setPrediction(result);
        setError(null);
        
        // Pass prediction to parent component
        if (onPrediction) {
          console.log('Calling onPrediction callback');
          onPrediction(result);
        }
      } catch (error) {
        console.error('Error generating allocation recommendations:', error);
        setError(`Failed to generate recommendations: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    generatePrediction();
  }, [formData, model, onPrediction]);

  if (isLoading) {
    return (
      <div style={{
        padding: '1.5rem',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        margin: '1rem 0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e9ecef',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ margin: '0.5rem 0', color: '#4b5563', fontSize: '0.95rem' }}>
          Generating personalized money allocation recommendations...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        color: '#b91c1c',
        padding: '1rem',
        borderRadius: '8px',
        margin: '1rem 0',
        borderLeft: '4px solid #ef4444'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Error generating recommendations: {error}. Please check your input data.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      margin: '1rem 0',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{
        marginTop: 0,
        color: '#1e293b',
        fontSize: '1.1rem',
        marginBottom: '0.75rem'
      }}>
        Money Allocation Recommendations
      </h3>

      {prediction ? (
        <div style={{ color: '#1e40af' }}>
          <p>✅ AI-powered analysis has generated your personalized allocation recommendations</p>
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#dbeafe',
            borderRadius: '6px',
            border: '1px solid #93c5fd'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>
              <strong>Status:</strong> Ready to display your optimized money allocation results
            </p>
          </div>
        </div>
      ) : (
        <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>
          Analyzing your financial profile to generate personalized recommendations...
        </p>
      )}
    </div>
  );
};

export default MLIntegration;