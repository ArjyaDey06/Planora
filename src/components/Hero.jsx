import { SignedOut, SignInButton } from '@clerk/clerk-react'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-grid">
        <div>
          <span className="eyebrow">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'linear-gradient(135deg, #7c5cff, #36d1dc)' }} />
            India's First AI Financial Advisor
          </span>
          <h1 className="headline">Planora - Your Personal AI Financial Advisor</h1>
          <p className="subhead">Planora analyzes your income, expenses, and goals to create a smart financial plan that balances needs, wants, and savings—updated in real-time as life changes.</p>
          <div className="hero-ctas">
            
          
          </div>
        </div>
      </div>
    </section>
  )
}







