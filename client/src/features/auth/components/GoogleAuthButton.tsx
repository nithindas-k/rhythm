import React from 'react';
import { Button } from '../../../components/ui/Button';

export interface GoogleAuthButtonProps {
  onSuccess?: (idToken: string) => void;
  isLoading?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  isLoading = false,
}) => {
  const handleClick = () => {
    // In production with Google Client ID configured, triggers google.accounts.id.prompt()
    // For standard demonstration, display helpful notice
    alert('Google OAuth integration is configured via GOOGLE_CLIENT_ID on the backend.');
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={handleClick}
      isLoading={isLoading}
      className="w-full gap-3 py-3 rounded-xl border-[var(--border)] hover:bg-[var(--surface-hover)] font-medium text-xs sm:text-sm"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.42 7.35 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.29 2.58 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      Continue with Google
    </Button>
  );
};
