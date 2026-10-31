import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#D4381D]/15 selection:text-[#D4381D]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        <div className="bg-[#FFFFFF] border border-[#E2DFD8] rounded-xs shadow-lg p-8 sm:p-10 text-center relative animate-slide-down">
          <div className="corner-bracket corner-bracket-tl" />
          <div className="corner-bracket corner-bracket-tr" />

          {/* Alert Icon */}
          <div className="mx-auto w-12 h-12 rounded-xs bg-[#FDE8E6] border border-[#F8B4AF] flex items-center justify-center text-[#C5281B] mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <span className="section-tag">STATUTORY AUTHORIZATION REQUIRED</span>
          <h1 className="text-xl font-bold tracking-tight text-[#141413] mt-1">
            Access Restricted
          </h1>

          <p className="text-xs text-[#6E6D67] mt-3 leading-relaxed">
            Your current assigned privilege level (<strong>{user?.role || 'USER'}</strong>) does not permit access to this statutory administrative function.
          </p>

          <div className="mt-5 p-3 rounded-xs bg-[#FAF9F6] border border-[#E2DFD8] text-[11px] font-mono text-[#6E6D67] text-left">
            <p className="font-semibold text-[#141413]">Active User Session:</p>
            <p className="truncate mt-0.5">{user?.email}</p>
            <p className="mt-1">Designation: {user?.full_name}</p>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full justify-center !py-2.5 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Return to Dashboard</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn-secondary w-full justify-center !py-2.5 text-xs font-semibold text-[#C5281B] hover:bg-[#FDE8E6] border-[#F8B4AF] cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Sign In with Different Credentials</span>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-[#EAE7DF] text-[10px] font-mono text-[#8F8E87]">
            DIRECTORATE OF LEGAL METROLOGY &bull; RBAC PROTOCOL
          </div>
        </div>

      </div>
    </div>
  );
};

export default UnauthorizedPage;
