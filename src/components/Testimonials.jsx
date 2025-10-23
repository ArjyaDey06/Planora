const quotes = [
  {
    text: 'I finally have a plan I can stick to. It adjusts automatically during freelance spikes without me doing anything.',
    name: 'Aditya, Designer',
  },
  {
    text: 'I paid off my last credit card 9 months earlier than my spreadsheet predicted.',
    name: 'Marco, Teacher',
  },
  {
    text: 'It nudged me to increase savings during a bonus instead of spending it. Exactly what I needed.',
    name: 'Priya, Engineer',
  },
  {
    text: 'Planora helped me save for my dream home. The AI insights were spot on with my financial goals.',
    name: 'Rahul, Software Developer',
  },
  {
    text: 'Managing multiple loans was a nightmare until I found Planora. Now I have a clear path to debt freedom.',
    name: 'Anjali, Marketing Manager',
  },
  {
    text: 'The investment guidance is incredible. I started with SIPs and now I\'m confident about my portfolio.',
    name: 'Vikram, Business Analyst',
  },
  {
    text: 'Emergency fund planning was never this easy. Planora made me realize the importance of financial security.',
    name: 'Meera, Doctor',
  },
  {
    text: 'From living paycheck to paycheck to having a solid financial plan - Planora changed my life completely.',
    name: 'Arjun, Sales Executive',
  },
  {
    text: 'The goal-based planning feature helped me save for my child\'s education. It\'s like having a personal financial advisor.',
    name: 'Sunita, HR Manager',
  }
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="section">
      <div className="container">
        <h2>Loved by people taking control</h2>
        <div className="testimonials">
          {quotes.map((q) => (
            <blockquote className="quote" key={q.name}>
              <p>“{q.text}”</p>
              <div className="name">{q.name}</div>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}




