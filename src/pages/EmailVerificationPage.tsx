import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { CheckCircle2, AlertCircle, Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const verify = async () => {
      try {
        await AuthService.verifyEmail(token);
        if (isMounted) {
          setSuccess(true);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Verification token is invalid or has expired.');
          setSuccess(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError(null);
    setResendSuccess(false);

    if (!resendEmail.trim()) {
      setResendError('Please enter your registered email address.');
      return;
    }

    setResending(true);
    try {
      await AuthService.resendVerification(resendEmail.trim());
      setResendSuccess(true);
    } catch (err: any) {
      setResendError(err?.message || 'Failed to dispatch verification email.');
    } finally {
      setResending(false);
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
            <span className="section-tag">ACCOUNT VERIFICATION</span>
            <h1 className="text-xl font-bold tracking-tight text-[#141413]">
              Email Verification
            </h1>
            <p className="text-xs text-[#6E6D67] mt-1">
              Statutory verification of your official account credentials.
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#D4381D] animate-spin" />
              <p className="text-xs font-semibold text-[#141413]">Validating Verification Token...</p>
              <p className="text-[11px] text-[#6E6D67] font-mono">Connecting with Directorate Authority</p>
            </div>
          ) : success ? (
            <div className="mt-6 space-y-4 animate-fade-in">
              <div className="p-4 rounded-xs bg-[#EBF7EE] border border-[#BBE5C7] text-[#1B7F43] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Email Successfully Verified</p>
                  <p className="mt-1 text-[#2E7D32] leading-relaxed">
                    Your account has been officially verified. Full inspection privileges under the Legal Metrology Act have been enabled.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="btn-accent w-full justify-center !py-2.5 text-xs font-semibold cursor-pointer"
              >
                Sign In to Inspection Hub
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {error && (
                <div className="p-4 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Verification Failed</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Resend Form */}
              <div className="border border-[#E2DFD8] rounded-xs p-4 bg-[#FAF9F6] space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-[#141413] uppercase tracking-wider font-mono">
                    Resend Verification Link
                  </h3>
                  <p className="text-[11px] text-[#6E6D67] mt-0.5">
                    Enter your email to receive a fresh verification link.
                  </p>
                </div>

                {resendSuccess && (
                  <div className="p-3 rounded-xs bg-[#EBF7EE] border border-[#BBE5C7] text-[#1B7F43] text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>A fresh verification link has been dispatched to your email.</span>
                  </div>
                )}

                {resendError && (
                  <div className="p-3 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resendError}</span>
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8E87]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="officer@legalmetrology.gov.in"
                      className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] placeholder:text-[#8F8E87] rounded-xs focus:outline-none focus:border-[#141413] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resending}
                    className="btn-primary w-full justify-center !py-2 text-xs font-semibold cursor-pointer"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Dispatch Verification Email</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="pt-2 text-center border-t border-[#EAE7DF]">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#6E6D67] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default EmailVerificationPage;

