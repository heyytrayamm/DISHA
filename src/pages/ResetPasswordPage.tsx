import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing from the URL.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet the statutory security requirements.');
      return;
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password. The link may have expired or was already used.');
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
            <span className="section-tag">SECURITY CREDENTIALS</span>
            <h1 className="text-xl font-bold tracking-tight text-[#141413]">
              Set New Password
            </h1>
            <p className="text-xs text-[#6E6D67] mt-1">
              Create a compliant password to restore your inspection access.
            </p>
          </div>

          {!token ? (
            <div className="mt-6 p-4 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Invalid Recovery Link</span>
              </div>
              <p>No authorization token was detected in your reset link. Please request a new password recovery link.</p>
              <Link to="/forgot-password" className="btn-secondary !py-1.5 !px-3 text-xs inline-flex">
                Request New Link
              </Link>
            </div>
          ) : success ? (
            <div className="mt-6 space-y-4 animate-fade-in">
              <div className="p-4 rounded-xs bg-[#EBF7EE] border border-[#BBE5C7] text-[#1B7F43] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Password Successfully Updated</p>
                  <p className="mt-1 text-[#2E7D32] leading-relaxed">
                    Your password has been changed securely and previous sessions revoked. You may now sign in.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-accent w-full justify-center !py-2.5 text-xs font-semibold cursor-pointer"
                >
                  Proceed to Sign In
                </button>
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

              {/* New Password */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8E87]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
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

              {/* Confirm Password */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                  Confirm New Password
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
                    placeholder="Re-enter new password"
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

              {/* Checklist */}
              <div className="p-3 bg-[#FAF9F6] border border-[#E2DFD8] rounded-xs text-[10px] font-mono text-[#6E6D67] space-y-1">
                <p className="font-bold uppercase tracking-wider text-[#141413]">Requirements:</p>
                <p className={hasMinLength ? 'text-[#1B7F43]' : ''}>&bull; Minimum 8 characters</p>
                <p className={hasUppercase && hasLowercase ? 'text-[#1B7F43]' : ''}>&bull; Uppercase & lowercase letters</p>
                <p className={hasDigit && hasSpecial ? 'text-[#1B7F43]' : ''}>&bull; At least one digit and special symbol</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full justify-center !py-2.5 text-xs font-semibold cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>

              <div className="pt-4 text-center border-t border-[#EAE7DF]">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#6E6D67] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel & Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;

