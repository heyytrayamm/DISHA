import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';
import {
  User,
  Mail,
  Shield,
  Building,
  Calendar,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Save,
  ArrowLeft
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [locationUnit, setLocationUnit] = useState(user?.location_unit || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await AuthService.updateProfile({
        full_name: fullName.trim(),
        location_unit: locationUnit.trim()
      });
      updateUser(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile information.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!isPasswordValid) {
      setPasswordError('New password must fulfill the 8+ character and symbol requirements.');
      return;
    }
    if (!doPasswordsMatch) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await AuthService.changePassword(currentPassword, newPassword, confirmPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Active Session';

  return (
    <div className="min-h-screen bg-[#F7F6F2] py-8 selection:bg-[#D4381D]/15 selection:text-[#D4381D]">
      <div className="disha-workspace max-w-4xl space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2DFD8] pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-xs border border-[#E2DFD8] hover:bg-[#FFFFFF] text-[#6E6D67] hover:text-[#141413] transition-colors cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="section-tag">STATUTORY IDENTITY</span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413]">
                Official Profile & Credentials
              </h1>
              <p className="text-xs text-[#6E6D67] mt-0.5">
                Manage your statutory identity, jurisdictional unit, and access keys.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn-secondary text-xs !py-1.5 !px-3 font-semibold cursor-pointer"
          >
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ═══ LEFT COLUMN: Account Badge & Information ═══ */}
          <div className="space-y-6 md:col-span-1">
            <div className="disha-card p-6 bg-[#FFFFFF] relative overflow-hidden">
              <div className="corner-bracket corner-bracket-tl" />
              <div className="corner-bracket corner-bracket-tr" />

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xs bg-[#141413] text-[#FFFFFF] font-mono text-2xl font-bold flex items-center justify-center shadow-md">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <h2 className="text-base font-bold text-[#141413] mt-3">
                  {user?.full_name}
                </h2>
                <p className="text-xs text-[#6E6D67] font-mono mt-0.5 break-all">
                  {user?.email}
                </p>

                <div className="mt-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider ${
                      user?.role === 'SYSTEM_ADMIN'
                        ? 'bg-[#EFECE6] text-[#141413] border border-[#D5D2C8]'
                        : user?.role === 'ENFORCEMENT_OFFICER'
                        ? 'bg-[#FAF4F2] text-[#D4381D] border border-[#F8B4AB]'
                        : 'bg-[#F2F0E8] text-[#4A4944] border border-[#DCD8CE]'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>
                      {user?.role === 'SYSTEM_ADMIN'
                        ? 'System Administrator'
                        : user?.role === 'ENFORCEMENT_OFFICER'
                        ? 'Enforcement Officer'
                        : 'Statutory User'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Status Details */}
              <div className="mt-6 pt-5 border-t border-[#E2DFD8] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6D67] flex items-center gap-1.5 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1B7F43]" />
                    <span>Account Status:</span>
                  </span>
                  <span className="badge-pass font-mono text-[10px]">
                    {user?.is_active ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6E6D67] flex items-center gap-1.5 font-mono text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-[#8F8E87]" />
                    <span>Email Verified:</span>
                  </span>
                  {user?.email_verified ? (
                    <span className="badge-pass font-mono text-[10px]">VERIFIED</span>
                  ) : (
                    <span className="badge-fail font-mono text-[10px]">UNVERIFIED</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6E6D67] flex items-center gap-1.5 font-mono text-[11px]">
                    <Building className="w-3.5 h-3.5 text-[#8F8E87]" />
                    <span>Jurisdiction:</span>
                  </span>
                  <span className="font-semibold text-[#141413] text-[11px] truncate max-w-[120px]">
                    {user?.location_unit || 'Delhi Zone'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6E6D67] flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#8F8E87]" />
                    <span>Enrolled On:</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#6E6D67]">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF9F6] border border-[#E2DFD8] rounded-xs text-[11px] text-[#6E6D67] space-y-2">
              <span className="font-mono font-bold text-[#141413] uppercase tracking-wider block">
                Statutory Privilege Notice
              </span>
              <p className="leading-relaxed">
                Roles and inspection authorizations are assigned by the Central Metrology Directorate and cannot be modified locally.
              </p>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN: Profile Form & Password Change ═══ */}
          <div className="space-y-6 md:col-span-2">
            
            {/* 1. Profile Information */}
            <div className="disha-card p-6 bg-[#FFFFFF]">
              <div className="flex items-center justify-between border-b border-[#E2DFD8] pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4381D]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Official Profile Details
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#8F8E87]">Editable</span>
              </div>

              {profileSuccess && (
                <div className="mb-4 p-3 rounded-xs bg-[#EBF7EE] border border-[#BBE5C7] text-[#1B7F43] text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Profile details updated successfully.</span>
                </div>
              )}

              {profileError && (
                <div className="mb-4 p-3 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] rounded-xs focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Official Email (Immutable)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E2DFD8] text-xs text-[#8F8E87] rounded-xs cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#8F8E87] mt-1">
                    To modify statutory email address, submit Form LM-7 to your zonal nodal officer.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Inspection Unit / Jurisdiction Zone
                  </label>
                  <input
                    type="text"
                    value={locationUnit}
                    onChange={(e) => setLocationUnit(e.target.value)}
                    placeholder="e.g. Delhi Zone 4 Field Inspection"
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] rounded-xs focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary text-xs font-semibold !py-2 !px-4 cursor-pointer"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Change Password */}
            <div className="disha-card p-6 bg-[#FFFFFF]">
              <div className="flex items-center justify-between border-b border-[#E2DFD8] pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#D4381D]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Change Security Password
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#8F8E87]">Revokes Active Tokens</span>
              </div>

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xs bg-[#EBF7EE] border border-[#BBE5C7] text-[#1B7F43] text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password updated successfully. Other active sessions revoked.</span>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] text-[#C5281B] text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 pr-10 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] rounded-xs focus:outline-none focus:border-[#141413]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8F8E87] hover:text-[#141413] cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    New Compliant Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3 pr-10 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] rounded-xs focus:outline-none focus:border-[#141413]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8F8E87] hover:text-[#141413] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D67] block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2DFD8] text-xs text-[#141413] rounded-xs focus:outline-none focus:border-[#141413]"
                  />
                  {confirmPassword && (
                    <p className={`text-[11px] mt-1 ${doPasswordsMatch ? 'text-[#1B7F43]' : 'text-[#C5281B]'}`}>
                      {doPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn-accent text-xs font-semibold !py-2 !px-4 cursor-pointer"
                  >
                    {passwordSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
