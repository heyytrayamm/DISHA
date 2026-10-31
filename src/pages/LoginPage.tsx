import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Official email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#D4381D]/15 selection:text-[#D4381D]">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        
        {/* Main Card */}
        <div className="bg-[#FFFFFF] border border-[#E2DFD8] rounded-xs shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-slide-down">
          
          {/* ═══ LEFT PANEL: Government Identity & Portal Context ═══ */}
          <div className="md:col-span-5 bg-[#FAF9F6] border-b md:border-b-0 md:border-r border-[#E2DFD8] p-8 sm:p-10 flex flex-col justify-between relative">
            <div className="corner-bracket corner-bracket-tl" />
            <div className="corner-bracket corner-bracket-tr hidden md:block" />
            <div className="corner-bracket corner-bracket-bl" />
            
            <div>
              {/* Brand Header */}
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

              {/* Editorial Statement */}
              <div className="mt-12 space-y-3">
                <span className="section-tag">STATUTORY COMPLIANCE PORTAL</span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] leading-tight">
                  Legal Metrology<br />
                  <span className="text-[#D4381D]">Verification</span> System
                </h1>
                <p className="text-xs text-[#6E6D67] leading-relaxed pt-2">
                  AI-Powered Packaged Commodity Label Compliance under Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011.
                </p>
              </div>

              <div className="mt-8 space-y-2.5 bg-[#FFFFFF] p-3.5 border border-[#E2DFD8] rounded-xs">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#141413]">
                  <ShieldCheck className="w-4 h-4 text-[#1B7F43]" />
                  <span>Statutory Security Standards</span>
                </div>
                <p className="text-[10px] text-[#6E6D67] leading-normal font-mono">
                  Enforces encrypted authentication, short-lived tokens, and strict audit integrity.
                </p>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="mt-12 pt-4 border-t border-[#EAE7DF] text-[10px] font-mono text-[#8F8E87] space-y-1">
              <div className="flex items-center gap-1.5 text-[#141413] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B7F43]" />
                <span>DIRECTORATE OF LEGAL METROLOGY</span>
              </div>
              <div>GOVERNMENT OF INDIA &bull; OFFICIAL ACCESS ONLY</div>
            </div>
          </div>

          {/* ═══ RIGHT PANEL: Sign In Form ═══ */}
          <div className="md:col-span-7 bg-[#FFFFFF] p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between border-b border-[#E2DFD8] pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#141413]">Official Sign In</h2>
                  <p className="text-xs text-[#6E6D67] mt-1">Enter your statutory credentials</p>
                </div>
                <span className="text-[10px] font-mono uppercase bg-[#FAF9F6] border border-[#E2DFD8] px-2 py-0.5 rounded-xs text-[#6E6D67]">
                  SECURE PORTAL
                </span>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email Field */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Email Address
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67]">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[10px] font-medium text-[#D4381D] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8E87]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
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

                {/* Remember Me Option */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-xs accent-[#141413] border-[#E2DFD8] text-[#141413] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-[#6E6D67]">Remember this workstation</span>
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
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In to Inspection Hub</span>
                  )}
                </button>
              </form>

              {/* Registration Link */}
              <div className="mt-8 pt-4 border-t border-[#EAE7DF] text-center">
                <p className="text-xs text-[#6E6D67]">
                  New statutory official or compliant enterprise?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-[#141413] hover:text-[#D4381D] transition-colors underline"
                  >
                    Register an Account
                  </Link>
                </p>
              </div>
            </div>

            {/* Google Login info */}
            <div className="mt-6 pt-3 text-center border-t border-[#FAF9F6]">
              <p className="text-[10px] text-[#8F8E87] font-mono">
                SSO & National Informatics Centre (NIC) Gateway Integration Enabled
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;

