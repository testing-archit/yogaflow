import React from 'react';
import { X } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToSignup: _ }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative animate-fade-in-up max-w-[400px] w-full">
        {/* Subtle floating close button outside the modal card for a cleaner look */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-top-4 sm:-right-12 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <X size={24} />
        </button>

        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full flex justify-center",
              card: "shadow-2xl rounded-[2rem] border-none m-0 w-full max-w-md",
              headerTitle: "text-3xl font-serif font-bold text-slate-900",
              headerSubtitle: "text-slate-600",
              formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white shadow-lg py-3 rounded-xl transition-all",
              footerActionLink: "text-teal-600 font-bold hover:text-teal-700",
              socialButtonsBlockButton: "rounded-xl border border-slate-200 hover:bg-slate-50 transition-all",
              formFieldInput: "rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all py-2.5",
            }
          }}
          routing="hash"
        />
      </div>
    </div>
  );
};

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSwitchToLogin: _ }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative animate-fade-in-up max-w-[400px] w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-top-4 sm:-right-12 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <X size={24} />
        </button>

        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full flex justify-center",
              card: "shadow-2xl rounded-[2rem] border-none m-0 w-full max-w-md",
              headerTitle: "text-3xl font-serif font-bold text-slate-900",
              headerSubtitle: "text-slate-600",
              formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white shadow-lg py-3 rounded-xl transition-all",
              footerActionLink: "text-teal-600 font-bold hover:text-teal-700",
              socialButtonsBlockButton: "rounded-xl border border-slate-200 hover:bg-slate-50 transition-all",
              formFieldInput: "rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all py-2.5",
            }
          }}
          routing="hash"
        />
      </div>
    </div>
  );
};
