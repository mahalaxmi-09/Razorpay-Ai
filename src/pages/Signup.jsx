import React, { useState, useEffect } from 'react';
import '../styles/loginAnimation.css';
import { Sparkles, User, Building, Mail, Eye, EyeOff } from 'lucide-react';

export default function Signup({ onLogin, onNavigate }) {
  const [fullName, setFullName] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation States
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({ fullName: '', merchantName: '', email: '', password: '', confirmPassword: '' });

  // Rotating circle active indicator index
  const [activeBar, setActiveBar] = useState(0);
  const numBars = 48;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBar((prev) => (prev + 1) % numBars);
    }, 70);
    return () => clearInterval(timer);
  }, [numBars]);

  const getTrailClass = (idx) => {
    const diff = (activeBar - idx + numBars) % numBars;
    if (diff >= 0 && diff < 8) {
      return `trail-${diff}`;
    }
    return '';
  };

  const handleInputChange = (field, value) => {
    if (field === 'fullName') setFullName(value);
    if (field === 'merchantName') setMerchantName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);

    setErrors(prev => ({ ...prev, [field]: '' }));
    setFeedback({ text: '', type: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ text: '', type: '' });

    let isValid = true;
    const currentErrors = { fullName: '', merchantName: '', email: '', password: '', confirmPassword: '' };

    // 1. Name checks
    if (!fullName.trim()) {
      currentErrors.fullName = 'Full Name is required.';
      isValid = false;
    }
    if (!merchantName.trim()) {
      currentErrors.merchantName = 'Merchant / Business Name is required.';
      isValid = false;
    }

    // 2. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      currentErrors.email = 'Corporate email is required.';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      currentErrors.email = 'Please enter a valid corporate email format.';
      isValid = false;
    }

    // 3. Password checks
    if (!password) {
      currentErrors.password = 'Access password is required.';
      isValid = false;
    } else if (password.length < 6) {
      currentErrors.password = 'Password must be at least 6 characters.';
      isValid = false;
    }

    if (password !== confirmPassword) {
      currentErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    setErrors(currentErrors);

    if (!isValid) return;

    // 4. Simulated Account Creation Delay
    setIsSubmitting(true);

    setTimeout(() => {
      setFeedback({ text: '✅ Successfully registered! Account created.', type: 'success' });
      
      setTimeout(() => {
        setIsSubmitting(false);
        onLogin(fullName || merchantName || 'User'); // login user session
      }, 800);
    }, 1000);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        {/* Large outer circular radar animation with glowing ₹ symbols enclosing the card */}
        <div className="circle-container">
          {Array.from({ length: numBars }).map((_, idx) => (
            <div
              key={idx}
              className={`rupee-tick ${getTrailClass(idx)}`}
              style={{
                transform: `rotate(${(360 / numBars) * idx}deg) translateY(calc(-1 * var(--radar-radius-signup)))`
              }}
            >
              ₹
            </div>
          ))}
        </div>

        {/* Primary Signup Card Wrapper */}
        <div className="login-box" style={{ width: '440px', padding: '30px' }}>
          <div className="brand-logo-header">
            {/* Monogram Monotone Logo */}
            <svg width="32" height="32" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M46,40 L72,64 L64,64 L40,40 Z" fill="#0096FF" />
              <path d="M72,20 L44,64 L52,64 L78,20 H72 Z" fill="#A6DBFF" />
            </svg>
            <h2>RazorRecover AI</h2>
          </div>
          <p className="login-tagline">Recover revenue. Intelligently.</p>

          {/* Validation feedback alert banner */}
          {feedback.text && (
            <div className={`form-feedback ${feedback.type === 'error' ? 'error-state' : 'success-state'}`} role="alert">
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                required
                value={fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Mounika"
                className={errors.fullName ? 'invalid-field' : ''}
              />
              <span className="input-icon">
                <User size={15} />
              </span>
              {errors.fullName && <span className="validation-message">{errors.fullName}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="merchantName">Business / Merchant Name</label>
              <input
                type="text"
                id="merchantName"
                required
                value={merchantName}
                onChange={(e) => handleInputChange('merchantName', e.target.value)}
                placeholder="Acme Payments Pvt Ltd"
                className={errors.merchantName ? 'invalid-field' : ''}
              />
              <span className="input-icon">
                <Building size={15} />
              </span>
              {errors.merchantName && <span className="validation-message">{errors.merchantName}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="email">Work Email</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="mounika@company.com"
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
                onChange={(e) => handleInputChange('password', e.target.value)}
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

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className={errors.confirmPassword ? 'invalid-field' : ''}
              />
              {errors.confirmPassword && <span className="validation-message">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'GET STARTED'}</span>
              {!isSubmitting && <Sparkles size={14} />}
            </button>
          </form>

          {/* Navigation link to sign in */}
          <div className="mt-5 text-center text-xs text-[#94A3B8] font-semibold">
            Already have an account?{' '}
            <a 
              href="#/login" 
              onClick={(e) => { e.preventDefault(); onNavigate('#/login'); }} 
              className="text-[#0096FF] hover:underline font-bold"
            >
              Sign in
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
