'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoHeaderProps {
  logoUrl?: string;
  logoAlt?: string;
  showSettings?: boolean;
  onSettingsClick?: () => void;
}

export function LogoHeader({
  logoUrl,
  logoAlt = 'Logo',
  showSettings = true,
  onSettingsClick,
}: LogoHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const shouldShowImage = logoUrl && !imageError;

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
      {/* Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        {shouldShowImage ? (
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <Image
              src={logoUrl}
              alt={logoAlt}
              fill
              className="object-contain rounded-lg"
              onError={() => setImageError(true)}
              priority
              sizes="(max-width: 640px) 32px, 40px"
            />
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm sm:text-lg">J</span>
          </div>
        )}
        <span className="text-base sm:text-xl font-semibold text-white/90 truncate">
          Job Intelligence
        </span>
      </div>

      {/* Settings button */}
      {showSettings && (
        <button
          onClick={onSettingsClick}
          className="btn-ghost flex items-center gap-2 text-white/60 hover:text-white/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="hidden sm:inline">Settings</span>
        </button>
      )}
    </header>
  );
}
