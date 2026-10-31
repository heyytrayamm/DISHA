import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      navigate('/login');
    }
  }, [isOpen, navigate]);

  return null;
};

export default LoginModal;
