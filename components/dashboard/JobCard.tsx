'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { getCompanyLogoUrl } from '@/lib/utils/company-logo';
import { computePowerScore, getDescriptionPreview } from '@/lib/utils/power-leads';
import type { Job } from '@/types';

interface JobCardProps {
  job: Job;
  index?: number;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  isChecked?: boolean;
  onCheck?: (id: string, shiftKey: boolean) => void;
}

export function JobCard({ job, index = 0, onSelect, isSelected, isChecked, onCheck }: JobCardProps) {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = getCompanyLogoUrl(job);
  const showLogo = logoUrl && !logoError;
  const power = useMemo(() => computePowerScore(job), [job]);
  const descriptionPreview = useMemo(() => getDescriptionPreview(job.description), [job.description]);

  const handleClick = () => {
    if (onSelect) {
      onSelect(job.id);
    } else {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const animationStyle = {
    animationDelay: `${index * 50}ms`,
  };

  const cardClass = cn(
    'p-4 sm:p-5 cursor-pointer animate-slide-up',
    power.tier === 'power' ? 'glass-card-power' : 'glass-card',
    isSelected && 'border-primary/50 bg-primary/5'
  );

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cardClass}
      style={animationStyle}
      role="article"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Checkbox */}
        {onCheck && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCheck(job.id, e.shiftKey);
            }}
            className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
              isChecked
                ? 'bg-primary/40 border-primary/60'
                : 'border-white/20 bg-white/5 hover:border-white/40'
            }`}
          >
            {isChecked && <CheckIcon className="w-3 h-3 text-white" />}
          </div>
        )}

        {/* Company Logo */}
        <div className="flex-shrink-0">
          {showLogo ? (
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white/5">
              <Image
                src={logoUrl!}
                alt={`${job.company} logo`}
                fill
                className="object-contain"
                onError={() => setLogoError(true)}
                sizes="48px"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center">
              <span className="text-primary-400 font-semibold text-sm sm:text-base">
                {job.company.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-white/60 truncate">
                {job.company}
              </p>
              <h3 className="text-sm sm:text-base font-medium text-white/90 truncate mt-0.5">
                {job.title}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-white/40">
                {job.postedAtRelative || formatRelativeTime(job.postedAt)}
              </span>
              {power.tier === 'power' && (
                <span className="badge-power-lead">
                  <BoltIcon className="w-3 h-3" />
                  Power Lead
                </span>
              )}
              {power.tier === 'strong' && (
                <span className="badge-strong-lead">
                  <BoltIcon className="w-3 h-3" />
                  Strong
                </span>
              )}
            </div>
          </div>

          {descriptionPreview && (
            <p className="text-xs text-white/35 truncate mt-1">
              {descriptionPreview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <LocationIcon className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{job.location}</span>
            </span>
            {job.employmentType && (
              <span className="hidden sm:inline">{job.employmentType}</span>
            )}
            {job.experienceLevel && (
              <span className="hidden sm:inline">{job.experienceLevel}</span>
            )}
            {job.salary && (
              <span className="text-primary-400 font-medium">{job.salary}</span>
            )}
            {job.applicantCount !== undefined && job.applicantCount > 0 && (
              <span>
                {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
              </span>
            )}
            {job.isRepeatHiring && (
              <span className="badge-repeat-hiring">Repeat Hiring</span>
            )}
            {job.isRecruiter && (
              <span className="badge-recruiter">Recruiter</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('flex-shrink-0', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
