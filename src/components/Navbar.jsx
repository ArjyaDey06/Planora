import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="#top" className="brand" aria-label="Planora home">
          <img className="brand-logo" src="/planora_new_logo.png" alt="Planora logo" />
        </a>

        <div className="nav-links" aria-label="Primary">
          <a href="#features">Domains</a>
          <a href="#testimonials">Stories</a>
        </div>

        <div className="nav-actions">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn">Sign in</button>
            </SignInButton>
           
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }} />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}

