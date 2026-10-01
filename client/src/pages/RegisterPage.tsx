import React from 'react';
import { Link } from 'react-router-dom';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { GoogleAuthButton } from '../features/auth/components/GoogleAuthButton';
import { ROUTES } from '../constants/routes';

export const RegisterPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Join Rhythm
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1.5">
          Listen together with friends in perfect real-time sync
        </p>
      </div>

      <RegisterForm />

      <div className="relative flex items-center justify-center my-1">
        <div className="w-full border-t border-[var(--border)]" />
        <span className="absolute bg-[var(--surface)] px-3 text-[11px] font-bold text-[var(--foreground-dim)] uppercase tracking-wider">
          Or
        </span>
      </div>

      <GoogleAuthButton />

      <p className="text-center text-xs text-[var(--foreground-muted)] mt-2">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-[var(--primary)] font-bold hover:underline transition-colors ml-1"
        >
          Log in
        </Link>
      </p>
    </div>
  );
};
