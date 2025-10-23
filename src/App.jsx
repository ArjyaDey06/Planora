import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import Features from './components/Features'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'
import Dashboard from './components/Dashboard'
import FinancialTracker from './components/FinancialTracker'
import IncomeExpenseQuestions from './components/IncomeExpenseQuestions'
import IncomeExpenseResult from './components/IncomeExpenseResult'
import DebtQuestions from './components/DebtQuestions'
import DebtResult from './components/DebtResult'
import Hero from './components/Hero'
import SavingsEmergencyQuestionnaire from './components/FinancialAssessment/SavingsQuestions'
import SavingsEmergencyResults from './components/FinancialAssessment/SavingsResults'
import InvestmentQuestions from './components/InvestmentQuestions'
import InvestmentResult from './components/InvestmentResult'
import GoalBasedPlanningQuestions from './components/FinancialAssessment/GoalBasedPlanningQuestions'
import GoalBasedPlanningResults from './components/FinancialAssessment/GoalBasedPlanningResults'

export default function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <main>
          <SignedOut>
            <Hero />
            <Features />
            <Testimonials />
          </SignedOut>
          <SignedIn>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/financial-tracker" element={<FinancialTracker />} />
              <Route path="/income-expense-questions" element={<IncomeExpenseQuestions />} />
              <Route path="/income-expense-results" element={<IncomeExpenseResult />} />
              <Route path="/debt-questions" element={<DebtQuestions />} />
              <Route path="/debt-results" element={<DebtResult />} />
              <Route path="/savings-emergency" element={<SavingsEmergencyQuestionnaire />} />
              <Route path="/savings-emergency-results" element={<SavingsEmergencyResults />} />
              <Route path="/investment-questions" element={<InvestmentQuestions />} />
              <Route path="/investment-results" element={<InvestmentResult />} />
              <Route path="/goal-based-planning" element={<GoalBasedPlanningQuestions />} />
              <Route path="/goal-based-planning/results" element={<GoalBasedPlanningResults />} />
            </Routes>
          </SignedIn>
        </main>
        <Footer />
      </div>
    </Router>
  )
}