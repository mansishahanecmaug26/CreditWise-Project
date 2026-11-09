import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const features = [
    { icon: '💳', title: 'Multi-Card Management', desc: 'Manage all your credit cards in one dashboard. HDFC, ICICI, SBI and more.' },
    { icon: '📊', title: 'Credit Utilization Tracking', desc: 'Real-time utilization percentage with color-coded alerts at 70%, 85%, 95% thresholds.' },
    { icon: '📅', title: 'Billing Cycle Management', desc: 'Auto-generate monthly statements, track due dates, and view minimum amounts due.' },
    { icon: '💰', title: 'Repayment Recording', desc: 'Log full or partial repayments and watch your outstanding balance update instantly.' },
    { icon: '🔔', title: 'Smart Alerts', desc: 'Never miss a due date. Get notified 7 days, 3 days, and 1 day before payment.' },
    { icon: '📈', title: 'Analytics & Reports', desc: 'Monthly spending charts, category breakdowns, and card-wise utilization graphs.' },
  ];

  const stats = [
    { value: 'One view', label: 'All your cards' },
    { value: '70 / 85 / 95%', label: 'Configurable alerts' },
    { value: '₹0', label: 'Payments processed' },
  ];

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-bg-grid"></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="hero-grid">
            <div className="slide-up">
              <div className="hero-badge">
                <i className="fas fa-shield-halved"></i>
                Simulation Project — No Real Banking Data
              </div>
              <h1 className="hero-title">
                Manage Your <span className="gradient-text">Credit Cards</span> Smarter
              </h1>
              <p className="hero-desc">
                CreditWise helps you track multiple credit cards, monitor utilization, manage billing cycles, 
                and get smart alerts — all from one beautiful dashboard.
              </p>
              <div className="hero-cta">
                {isAuthenticated ? (
                  <button className="btn-primary-cw" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')}>
                    <i className="fas fa-chart-pie"></i> Go to Dashboard
                  </button>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary-cw">
                      <i className="fas fa-rocket"></i> Get Started Free
                    </Link>
                    <Link to="/login" className="btn-secondary-cw">
                      <i className="fas fa-sign-in-alt"></i> Login
                    </Link>
                  </>
                )}
              </div>

              {/* Stats row */}
              <div className="hero-stats" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                {stats.map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-light)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Card Preview */}
            <div className="animate-float" style={{ position: 'relative' }}>
              <div className="credit-card-widget purple" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>HDFC Millennia</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>HDFC Bank</div>
                  </div>
                  <i className="fas fa-credit-card" style={{ fontSize: '1.5rem', opacity: 0.7 }}></i>
                </div>
                <div style={{ fontSize: '1.2rem', letterSpacing: '0.15em', marginBottom: '16px', fontWeight: '600' }}>
                  •••• •••• •••• 4521
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>CREDIT LIMIT</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700' }}>₹1,00,000</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>UTILIZATION</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fcd34d' }}>45%</div>
                  </div>
                </div>
              </div>

              {/* Dashboard preview snippet */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>CREDIT UTILIZATION</div>
                {[['HDFC', 45, '#8b5cf6'], ['ICICI', 75, '#f59e0b'], ['SBI', 40, '#22c55e']].map(([name, pct, color]) => (
                  <div key={name} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>{name}</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div className="utilization-bar">
                      <div className="utilization-fill" style={{ width: `${pct}%`, background: color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="section-title">Everything You <span className="gradient-text">Need</span></h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              A complete credit card management system built for the modern user.
            </p>
          </div>

          <div className="three-col-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ fontSize: '1.8rem', background: 'none' }}>{f.icon}</div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px' }}>{f.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '80px 48px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.15))', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
            Ready to Take Control of Your <span className="gradient-text">Credit?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Bring balances, billing dates, and simulated repayment history into one clear workspace.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register" className="btn-primary-cw">
              <i className="fas fa-user-plus"></i> Create Account
            </Link>
            <Link to="/about" className="btn-secondary-cw">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
