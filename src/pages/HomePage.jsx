import { useEffect, useState } from 'react'
import {
  CreditCard,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  ArrowUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components.jsx'

export function HomePage() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const updateScrollButton = () => setShowBackToTop(window.scrollY > 320)
    updateScrollButton()
    window.addEventListener('scroll', updateScrollButton, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollButton)
  }, [])

  return (
    <div className="home-shell min-h-screen">
      <PublicHeader />

      <main className="hero-shell">
        <section className="hero-section">
          <div className="hero-copy min-w-0">
            <h1>Take Control Of<br />Your Finances</h1>
            <p>
              Track income, manage expenses, set budgets,
              achieve your savings goals and build a better
              financial future.
            </p>

            <div className="cta-row">
              <Link to="/register" className="primary-button">Get Started</Link>
              <a href="#features" className="secondary-button">Learn More</a>
            </div>
          </div>

          <div className="illustration-panel min-w-0">
            <div className="home-illustration" aria-label="Illustration of a personal finance dashboard" role="img">
              <div className="illustration-orbit orbit-one" />
              <div className="illustration-orbit orbit-two" />
              <div className="float-icon float-savings"><PiggyBank size={19} /></div>
              <div className="float-icon float-growth"><TrendingUp size={17} /></div>
              <div className="illustration-plant"><i /><i /><i /><i /><b /></div>
              <div className="finance-dashboard">
                <div className="finance-topbar">
                  <div><span className="tiny-brand">PT</span><b>Dashboard</b></div>
                  <span className="tiny-avatar">JD</span>
                </div>
                <div className="finance-balance">
                  <small>Total Balance</small>
                  <strong>$4,750.00</strong>
                  <span>↑ 12.5%</span>
                </div>
                <div className="finance-chart">
                  <div className="chart-lines"><i /><i /><i /></div>
                  <svg viewBox="0 0 260 92" role="presentation" aria-hidden="true">
                    <defs>
                      <linearGradient id="home-chart-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#8195ff" stopOpacity=".2" />
                        <stop offset="1" stopColor="#8195ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M2 70 C22 67 24 48 42 55 S67 68 82 47 S110 54 124 39 S147 53 161 30 S187 44 202 22 S229 38 258 9 V92 H2Z" fill="url(#home-chart-fill)" />
                    <path d="M2 70 C22 67 24 48 42 55 S67 68 82 47 S110 54 124 39 S147 53 161 30 S187 44 202 22 S229 38 258 9" fill="none" stroke="#6275f5" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="chart-months"><span>May 01</span><span>May 15</span><span>May 30</span></div>
                </div>
                <div className="finance-stats">
                  <div><span>Income</span><b>$3,200</b><i className="stat-up" /></div>
                  <div><span>Expenses</span><b>$1,250</b><i className="stat-down" /></div>
                  <div><span>Savings</span><b>$1,950</b><i className="stat-up" /></div>
                </div>
              </div>
              <div className="illustration-person">
                <div className="person-hair" />
                <div className="person-face"><i /><i /></div>
                <div className="person-neck" />
                <div className="person-shirt" />
                <div className="person-arm" />
                <div className="person-pants" />
                <div className="person-leg leg-left" />
                <div className="person-leg leg-right" />
                <div className="person-shoe shoe-left" />
                <div className="person-shoe shoe-right" />
              </div>
              <div className="ground-shadow" />
              <div className="float-icon float-check"><ShieldCheck size={18} /></div>
              <div className="float-icon float-wallet"><Wallet size={18} /></div>
            </div>
          </div>
        </section>

        <section className="feature-row w-full" aria-label="Tracker highlights">
          <FeatureCard icon={<Wallet size={17} />} title="Track Income" description="Easily record all sources of income" />
          <FeatureCard icon={<CreditCard size={17} />} title="Manage Expenses" description="Keep track of your spending" />
          <FeatureCard icon={<PiggyBank size={17} />} title="Set Budgets" description="Plan your spending with budgets" />
          <FeatureCard icon={<Sparkles size={17} />} title="Achieve Goals" description="Save money and reach your goals" />
        </section>
      </main>

      <section className="home-info-section" id="features">
        <div className="home-info-inner">
          <div className="home-section-heading">
            <span className="home-eyebrow">Features</span>
            <h2>Everything you need to feel in control</h2>
            <p>One simple place to understand what comes in, where it goes, and what you are saving toward.</p>
          </div>
          <div className="home-feature-grid">
            <article className="home-info-card">
              <span className="home-info-icon income"><Wallet size={20} /></span>
              <h3>Know your income</h3>
              <p>Keep track of salary, freelance work, and other income in one clear view.</p>
            </article>
            <article className="home-info-card">
              <span className="home-info-icon expenses"><CreditCard size={20} /></span>
              <h3>Understand spending</h3>
              <p>Organize expenses by category and see how everyday spending adds up.</p>
            </article>
            <article className="home-info-card">
              <span className="home-info-icon budgets"><PiggyBank size={20} /></span>
              <h3>Stay on budget</h3>
              <p>Set category budgets and check your progress before you reach your limits.</p>
            </article>
            <article className="home-info-card">
              <span className="home-info-icon goals"><Target size={20} /></span>
              <h3>Reach savings goals</h3>
              <p>Track your progress toward the things that matter to you.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-info-section about-section" id="about">
        <div className="home-info-inner about-content">
          <span className="home-eyebrow">About</span>
          <h2>Small steps make money feel simpler</h2>
          <p>
            Personal Budget Tracker helps you bring income, expenses, budgets, and savings goals together.
            Instead of guessing where your money went, you can review your activity and make your next
            decision with more confidence.
          </p>
          <Link to="/register" className="primary-button">Start tracking</Link>
        </div>
      </section>

      <section className="home-info-section pricing-section" id="pricing">
        <div className="home-info-inner">
          <div className="home-section-heading">
            <span className="home-eyebrow">Pricing</span>
            <h2>Get started for free</h2>
            <p>Try the personal budgeting tools without a subscription.</p>
          </div>
          <article className="pricing-card">
            <div>
              <span className="pricing-label">Personal</span>
              <h3>Free</h3>
              <p>Everything you need to get started organizing your finances.</p>
            </div>
            <ul>
              <li><Wallet size={16} /> Income and expense tracking</li>
              <li><Landmark size={16} /> Categories and budgets</li>
              <li><Target size={16} /> Savings goals and reports</li>
            </ul>
            <Link to="/register" className="primary-button">Create your free account</Link>
            <small>Demo note: data is saved in this browser on this device.</small>
          </article>
        </div>
      </section>
      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={19} />
        </button>
      )}
    </div>
  )
}

export function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}
