import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to process password recovery request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#D4381D]/15 selection:text-[#D4381D]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        <div className="bg-[#FFFFFF] border border-[#E2DFD8] rounded-xs shadow-lg p-8 sm:p-10 relative animate-slide-down">
          <div className="corner-bracket corner-bracket-tl" />
          <div className="corner-bracket corner-bracket-tr" />

          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xs bg-[#141413] text-[#FFFFFF] flex items-center justify-center font-bold text-xs shadow-sm">
              <span className="font-mono tracking-tighter">DI</span>
            </div>
            <div>
              <span className="font-bold tracking-tight text-[#141413] text-sm block">
                DISHA
              </span>
              <p className="text-[10px] text-[#6E6D67] -mt-0.5">
                Digital Inspection & Standards Hub
              </p>
            </div>
          </div>

          <div className="space-y-1 border-b border-[#E2DFD8] pb-4">
            <span className="section-tag">ACCOUNT RECOVERY</span>
            <h1 className="text-xl font-bold tracking-tight text-[#141413]">
              Forgot Password
            </h1>
            <p className="text-xs text-[#6E6D67] mt-1">
              Enter your official email to receive password reset instructions.
            </p>
          </div>

          {submitted ? (
            <div className="mt-6 space-y-4 animate-fade-in">
              <div className="p-4 rounded-xs bg-[#EBF7EE] border border-[#BBE5C7] text-[#1B7F43] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Reset Instructions Dispatched</p>
                  <p className="mt-1 text-[#2E7D32] leading-relaxed">
                    If an account exists with <strong>{email}</strong>, you will receive an email containing a secure, single-use password reset link.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[#6E6D67] leading-relaxed font-mono">
                Note: In local development or when SMTP is unconfigured, the reset token is safely logged to the backend console.
              </p>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="btn-primary w-full justify-center !py-2.5 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full justify-center !py-2.5 text-xs font-semibold cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <span>Send Password Reset Link</span>
                )}
              </button>

              <div className="pt-4 text-center border-t border-[#EAE7DF]">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#6E6D67] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;

