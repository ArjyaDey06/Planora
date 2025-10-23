const features = [
  {
    title: 'Income & Expense Tracking',
    desc: 'Connect your accounts and let AI categorize spending, forecast bills, and smooth out income variability for better financial planning.',
    icon: '💰',
  },
  {
    title: 'Debt Management & Loan Advice',
    desc: 'Credit cards, personal loans, home loans - AI creates the best repayment strategy for your financial situation.',
    icon: '📉',
  },
  {
    title: 'Savings & Emergency Fund',
    desc: 'Smart savings plans tailored to your needs and prepared for emergency situations with Indian cost of living in mind.',
    icon: '🏦',
  },
  {
    title: 'Investment Guidance',
    desc: 'From FDs and mutual funds to SIPs and stock market - personalized advice based on your risk profile.',
    icon: '📈',
  },
  {
    title: 'Goal-Based Planning',
    desc: 'From home purchase to children\'s education - detailed planning and timelines for every financial goal.',
    icon: '🎯',
  },
]

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <h2>Financial Domains</h2>
        <p className="lead">Get a plan you can actually follow—and feel good about. No spreadsheets required.</p>
        <div className="features">
          {features.map((f) => (
            <article className="feature-card" key={f.title}>
              <div className="feature-icon" aria-hidden>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
              </div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}




