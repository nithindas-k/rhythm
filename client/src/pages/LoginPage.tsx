import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { GoogleAuthButton } from '../features/auth/components/GoogleAuthButton';
import { ROUTES } from '../constants/routes';

export const LoginPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1.5">
          Enter your credentials to access your shared music rooms
        </p>
      </div>

      <LoginForm />

      <div className="relative flex items-center justify-center my-1">
        <div className="w-full border-t border-[var(--border)]" />
        <span className="absolute bg-[var(--surface)] px-3 text-[11px] font-bold text-[var(--foreground-dim)] uppercase tracking-wider">
          Or
        </span>
      </div>

      <GoogleAuthButton />

      <p className="text-center text-xs text-[var(--foreground-muted)] mt-2">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="text-[var(--primary)] font-bold hover:underline transition-colors ml-1"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  );
};
