export default function Footer() {
  return (
    <footer>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div className="muted">© {new Date().getFullYear()} Planora. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a className="muted" href="#features">Features</a>
          
          <a className="muted" href="#top">Back to top</a>
        </div>
      </div>
    </footer>
  )
}




