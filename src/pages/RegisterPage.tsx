import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Check, X, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not fulfill the statutory security requirements.');
      return;
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('You must accept the terms of statutory compliance and system usage.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        accept_terms: acceptTerms
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#D4381D]/15 selection:text-[#D4381D]">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        
        {/* Main Card */}
        <div className="bg-[#FFFFFF] border border-[#E2DFD8] rounded-xs shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-slide-down">
          
          {/* ═══ LEFT PANEL: Statutory Guidelines ═══ */}
          <div className="md:col-span-5 bg-[#FAF9F6] border-b md:border-b-0 md:border-r border-[#E2DFD8] p-8 sm:p-10 flex flex-col justify-between relative">
            <div className="corner-bracket corner-bracket-tl" />
            <div className="corner-bracket corner-bracket-tr hidden md:block" />
            <div className="corner-bracket corner-bracket-bl" />
            
            <div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xs bg-[#141413] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shadow-sm">
                  <span className="font-mono tracking-tighter">DI</span>
                </div>
                <div>
                  <span className="font-bold tracking-tight text-[#141413] text-base block">
                    DISHA
                  </span>
                  <p className="text-[10px] text-[#6E6D67] font-medium -mt-0.5">
                    Digital Inspection & Standards Hub
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-3">
                <span className="section-tag">ACCOUNT REGISTRATION</span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] leading-tight">
                  Join the National<br />
                  <span className="text-[#D4381D]">Compliance</span> Network
                </h1>
                <p className="text-xs text-[#6E6D67] leading-relaxed pt-2">
                  Access standardized inspection tooling, OCR declaration verification, and statutory notice management.
                </p>
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-8 bg-[#FFFFFF] border border-[#E2DFD8] rounded-xs p-4 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] font-bold block mb-1">
                  Password Strength Requirements
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className={`flex items-center gap-2 ${hasMinLength ? 'text-[#1B7F43]' : 'text-[#8F8E87]'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-[#1B7F43]" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasUppercase ? 'text-[#1B7F43]' : 'text-[#8F8E87]'}`}>
                    {hasUppercase ? <Check className="w-3.5 h-3.5 text-[#1B7F43]" /> : <X className="w-3.5 h-3.5" />}
                    <span>One uppercase character (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasLowercase ? 'text-[#1B7F43]' : 'text-[#8F8E87]'}`}>
                    {hasLowercase ? <Check className="w-3.5 h-3.5 text-[#1B7F43]" /> : <X className="w-3.5 h-3.5" />}
                    <span>One lowercase character (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasDigit ? 'text-[#1B7F43]' : 'text-[#8F8E87]'}`}>
                    {hasDigit ? <Check className="w-3.5 h-3.5 text-[#1B7F43]" /> : <X className="w-3.5 h-3.5" />}
                    <span>One numerical digit (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasSpecial ? 'text-[#1B7F43]' : 'text-[#8F8E87]'}`}>
                    {hasSpecial ? <Check className="w-3.5 h-3.5 text-[#1B7F43]" /> : <X className="w-3.5 h-3.5" />}
                    <span>One special symbol (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#EAE7DF] text-[10px] font-mono text-[#8F8E87]">
              <span>MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION</span>
            </div>
          </div>

          {/* ═══ RIGHT PANEL: Registration Form ═══ */}
          <div className="md:col-span-7 bg-[#FFFFFF] p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between border-b border-[#E2DFD8] pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#141413]">Create Account</h2>
                  <p className="text-xs text-[#6E6D67] mt-1">Register for portal inspection privileges</p>
                </div>
                <span className="text-[10px] font-mono uppercase bg-[#FAF9F6] border border-[#E2DFD8] px-2 py-0.5 rounded-xs text-[#6E6D67]">
                  VERIFIED ACCESS
                </span>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8E87]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Officer Rajesh Kumar"
                      className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] placeholder:text-[#8F8E87] rounded-xs focus:outline-none focus:border-[#141413] transition-colors"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8E87]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@legalmetrology.gov.in"
                      className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] placeholder:text-[#8F8E87] rounded-xs focus:outline-none focus:border-[#141413] transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8E87]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full pl-9 pr-10 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] placeholder:text-[#8F8E87] rounded-xs focus:outline-none focus:border-[#141413] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8F8E87] hover:text-[#141413] cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8E87]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-10 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] placeholder:text-[#8F8E87] rounded-xs focus:outline-none focus:border-[#141413] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8F8E87] hover:text-[#141413] cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-[11px] mt-1 ${doPasswordsMatch ? 'text-[#1B7F43]' : 'text-[#C5281B]'}`}>
                      {doPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 rounded-xs accent-[#141413] border-[#E2DFD8] text-[#141413] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-[#6E6D67] leading-relaxed">
                      I accept the statutory guidelines under the Legal Metrology Act, 2009 and agree to the Terms of Service & Privacy Policy.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-accent w-full justify-center !py-2.5 text-xs font-semibold cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Official Account</span>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-8 pt-4 border-t border-[#EAE7DF] text-center">
                <p className="text-xs text-[#6E6D67]">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-[#141413] hover:text-[#D4381D] transition-colors underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 text-center border-t border-[#FAF9F6]">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8F8E87] font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1B7F43]" />
                <span>Zero Trust Architecture &bull; End-to-End Cryptographic Validation</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RegisterPage;

