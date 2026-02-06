'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Job } from '@/types';

interface JobCardRichProps {
  job: Job;
  index?: number;
}

export function JobCardRich({ job, index = 0 }: JobCardRichProps) {
  const [logoError, setLogoError] = useState(false);
  const showLogo = job.companyLogo && !logoError;

  const handleClick = () => {
    window.open(job.url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const animationStyle = {
    animationDelay: `${index * 60}ms`,
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="glass-card p-5 sm:p-6 cursor-pointer animate-slide-up"
      style={animationStyle}
      role="article"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company}`}
    >
      {/* Top row: Logo + Company + Time */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {showLogo ? (
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
              <Image
                src={job.companyLogo!}
                alt={`${job.company} logo`}
                fill
                className="object-contain"
                onError={() => setLogoError(true)}
                sizes="64px"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-400 font-semibold text-xl">
                {job.company.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-white/50">{job.company}</p>
            <h3 className="text-base sm:text-lg font-medium text-white/90 line-clamp-2 mt-0.5">
              {job.title}
            </h3>
          </div>
        </div>
        <span className="text-xs text-white/40 flex-shrink-0 mt-1">
          {job.postedAtRelative || formatRelativeTime(job.postedAt)}
        </span>
      </div>

      {/* Description preview */}
      {job.description && (
        <p className="text-sm text-white/40 line-clamp-2 mb-3">
          {job.description}
        </p>
      )}

      {/* Metadata + Badges */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/50">
        <span className="flex items-center gap-1">
          <LocationIcon className="w-3 h-3" />
          <span className="truncate max-w-[180px]">{job.location}</span>
        </span>
        {job.employmentType && <span>{job.employmentType}</span>}
        {job.experienceLevel && <span>{job.experienceLevel}</span>}
        {job.salary && <span className="text-primary-400">{job.salary}</span>}
        {job.applicantCount !== undefined && job.applicantCount > 0 && (
          <span>
            {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Badges */}
        {job.isRepeatHiring && (
          <span className="badge-repeat-hiring">
            <RepeatIcon className="w-3 h-3" />
            Repeat Hiring
          </span>
        )}
        {job.isRecruiter && (
          <span className="badge-recruiter">Recruiter</span>
        )}
      </div>
    </div>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('flex-shrink-0', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
