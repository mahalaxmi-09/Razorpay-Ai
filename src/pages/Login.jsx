import React, { useState, useEffect } from 'react';
import '../styles/loginAnimation.css';
import { Sparkles, Mail, Eye, EyeOff, ClipboardCheck } from 'lucide-react';

export default function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('mounika@razorrecover.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation States
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });

  // Rotating circle active indicator index
  const [activeBar, setActiveBar] = useState(0);
  const numBars = 50;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBar((prev) => (prev + 1) % numBars);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Determine if a segment bar is within the active radar sweep trail
  const isBarActive = (idx) => {
    const diff = (activeBar - idx + numBars) % numBars;
    return diff >= 0 && diff < 8; // Creates an 8-bar fading glow segment trail
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrors(prev => ({ ...prev, email: '' }));
    setFeedback({ text: '', type: '' });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrors(prev => ({ ...prev, password: '' }));
    setFeedback({ text: '', type: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ text: '', type: '' });
    
    let isValid = true;
    const currentErrors = { email: '', password: '' };

    // 1. Email Format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      currentErrors.email = 'Corporate email is required.';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      currentErrors.email = 'Please enter a valid email format (e.g. user@merchant.com).';
      isValid = false;
    }

    // 2. Password check
    if (!password) {
      currentErrors.password = 'Access password is required.';
      isValid = false;
    } else if (password.length < 6) {
      currentErrors.password = 'Password must be at least 6 characters.';
      isValid = false;
    }

    setErrors(currentErrors);

    if (!isValid) return;

    // 3. Simulated Auth Delay
    setIsSubmitting(true);
    
    setTimeout(() => {
      setFeedback({ text: '✅ Successfully logged in! Access granted.', type: 'success' });
      
      setTimeout(() => {
        setIsSubmitting(false);
        onLogin(email.split('@')[0]); // authenticate user segment
      }, 800);
    }, 1000);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        
        {/* Rotating circle animation containing the radar segments */}
        <div className="circle-container">
          {Array.from({ length: numBars }).map((_, idx) => (
            <div
              key={idx}
              className={`bar ${isBarActive(idx) ? 'active' : ''}`}
              style={{
                transform: `rotate(${(360 / numBars) * idx}deg) translateY(-170px)`
              }}
            />
          ))}
        </div>

        {/* Primary Login Card */}
        <div className="login-box">
          <div className="brand-logo-header">
            {/* Monogram Monotone Logo */}
            <svg width="36" height="36" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M46,40 L72,64 L64,64 L40,40 L46,40 Z" fill="#0096FF" />
              <path d="M72,20 L44,64 L52,64 L78,20 H72 Z" fill="#A6DBFF" />
            </svg>
            <h2>RazorRecover AI</h2>
          </div>
          <p className="login-tagline">Recover revenue. Intelligently.</p>

          {/* Verification feedback alert banner */}
          {feedback.text && (
            <div className={`form-feedback ${feedback.type === 'error' ? 'error-state' : 'success-state'}`} role="alert">
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="mounika@razorrecover.ai"
                className={errors.email ? 'invalid-field' : ''}
              />
              <span className="input-icon">
                <Mail size={15} />
              </span>
              {errors.email && <span className="validation-message">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={errors.password ? 'invalid-field' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="input-icon password-toggle"
                title="Show/Hide password"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              {errors.password && <span className="validation-message">{errors.password}</span>}
            </div>

            <div className="forgot-password">
              <a 
                href="#/forgot" 
                onClick={(e) => { e.preventDefault(); alert("Verification link sent to your email!"); }}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              <span>{isSubmitting ? 'VERIFYING...' : 'SIGN IN'}</span>
              {!isSubmitting && <Sparkles size={14} />}
            </button>
          </form>

          {/* Navigation link to registration */}
          <div className="mt-5 text-center text-xs text-[#94A3B8] font-semibold">
            Don't have an account?{' '}
            <a 
              href="#/signup" 
              onClick={(e) => { e.preventDefault(); onNavigate('#/signup'); }} 
              className="text-[#0096FF] hover:underline font-bold"
            >
              Sign up
            </a>
          </div>

          <div className="login-footer">
            <p>AI-powered revenue recovery platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
