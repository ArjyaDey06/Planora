import { useState } from 'react'
import { SignedIn } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  const financialDomains = [
    {
      id: 'income-expense',
      title: 'Income & Expense Tracking',
      icon: '💰',
      description: 'Analyze your income and expenses',
      status: 'active',
      route: '/income-expense-questions'
    },
    {
      id: 'debt-management',
      title: 'Debt Management',
      icon: '📉',
      description: 'Manage credit cards and loans',
      status: 'active',
      route: '/debt-questions'
    },
    {
      id: 'savings-emergency',
      title: 'Savings & Emergency Fund',
      icon: '🏦',
      description: 'Smart savings plans',
      status: 'active',
      route: '/savings-emergency'
    },
    {
      id: 'investment',
      title: 'Investment Guidance',
      icon: '📈',
      description: 'Smart investment planning and advice',
      status: 'active',
      route: '/investment-questions'
    },
    {
      id: 'goal-planning',
      title: 'Goal-Based Planning',
      icon: '🎯',
      description: 'Home, education, retirement planning',
      status: 'active',
      route: '/goal-based-planning'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'pending': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active'
      case 'warning': return 'Attention Needed'
      case 'pending': return 'Get Started'
      default: return 'Get Started'
    }
  }

  const handleDomainClick = (domain) => {
    if (domain.route) {
      navigate(domain.route)
    } else {
      setActiveTab(domain.id)
    }
  }

  return (
    <SignedIn>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Your Financial Dashboard</h1>
          <p>Welcome! Let's start your financial journey</p>
        </div>

        <div className="dashboard-grid">
          {financialDomains.map((domain) => (
            <div 
              key={domain.id} 
              className="domain-card" 
              onClick={() => handleDomainClick(domain)}
              style={{ cursor: domain.route ? 'pointer' : 'default' }}
            >
              <div className="domain-icon">{domain.icon}</div>
              <div className="domain-content">
                <h3>{domain.title}</h3>
                <p>{domain.description}</p>
                <span className={`status ${getStatusColor(domain.status)}`}>
                  {getStatusText(domain.status)}
                </span>
              </div>
            </div>
          ))}
        </div>


      </div>
    </SignedIn>
  )
}
