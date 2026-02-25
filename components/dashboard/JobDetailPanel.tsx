'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '@/lib/utils';
import { getCompanyLogoUrl } from '@/lib/utils/company-logo';
import { computePowerScore } from '@/lib/utils/power-leads';
import type { Job, Person } from '@/types';

interface JobDetailPanelProps {
  job: Job;
  onClose: () => void;
}

export function JobDetailPanel({ job, onClose }: JobDetailPanelProps) {
  const [logoError, setLogoError] = useState(false);
  const [copied, setCopied] = useState(false);
  const logoUrl = getCompanyLogoUrl(job);
  const showLogo = logoUrl && !logoError;
  const power = useMemo(() => computePowerScore(job), [job]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(job.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard not available */ });
  };

  const handleViewOnLinkedIn = () => {
    window.open(job.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40 sm:bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] lg:w-[560px] z-50 glass-panel-drawer flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-white/10">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Logo */}
            {showLogo ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-400 font-semibold text-lg">
                  {job.company.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-white/50">{job.company}</p>
              <h2 className="text-lg font-medium text-white/90 leading-tight">
                {job.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors flex-shrink-0 ml-2"
            aria-label="Close detail panel"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2">
            <MetaPill icon={<LocationIcon />} label={job.location} />
            {job.employmentType && (
              <MetaPill label={job.employmentType} />
            )}
            {job.experienceLevel && (
              <MetaPill label={job.experienceLevel} />
            )}
            {job.salary && (
              <MetaPill label={job.salary} highlight />
            )}
            {job.applicantCount !== undefined && job.applicantCount > 0 && (
              <MetaPill label={`${job.applicantCount} applicant${job.applicantCount !== 1 ? 's' : ''}`} />
            )}
            <MetaPill icon={<ClockIcon />} label={job.postedAtRelative || formatRelativeTime(job.postedAt)} />
          </div>

          {/* Badges */}
          {(power.tier || job.isRepeatHiring || job.isRecruiter) && (
            <div className="flex flex-wrap gap-2">
              {power.tier === 'power' && (
                <span className="badge-power-lead">
                  <BoltIcon className="w-3 h-3" />
                  Power Lead
                </span>
              )}
              {power.tier === 'strong' && (
                <span className="badge-strong-lead">
                  <BoltIcon className="w-3 h-3" />
                  Strong Lead
                </span>
              )}
              {job.isRepeatHiring && (
                <span className="badge-repeat-hiring">Repeat Hiring</span>
              )}
              {job.isRecruiter && (
                <span className="badge-recruiter">Recruiter</span>
              )}
            </div>
          )}

          {/* Company enrichment data */}
          {job.companyData && (
            <CompanyDataSection data={job.companyData} />
          )}

          {/* Decision makers */}
          {job.decisionMakers && job.decisionMakers.length > 0 && (
            <DecisionMakersSection contacts={job.decisionMakers} />
          )}

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Full description */}
          {job.description ? (
            <FormattedDescription text={job.description} />
          ) : (
            <p className="text-sm text-white/30 italic">
              No description available. View the full posting on LinkedIn.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={handleViewOnLinkedIn}
            className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            View on LinkedIn
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-ghost text-sm px-4 py-2.5"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

/**
 * Detect if a line looks like a section heading.
 * Matches: "Requirements", "Deliverables:", "Specialty/Competency: Software Engineering",
 * "About The Role", "What You'll Do", etc.
 */
function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Short lines that end with colon are headings (e.g. "Requirements:")
  if (trimmed.length <= 80 && trimmed.endsWith(':')) return true;

  // Lines with "key: value" pattern where key is a known metadata field
  const metadataKeyPattern = /^(specialty|competency|industry|sector|position|role|location|duration|salary|compensation|company|employer|department|team|division|time type|work type|job type|employment type|travel|start date|reports? to|reporting to)[/\s]*:/i;
  if (metadataKeyPattern.test(trimmed)) return true;

  // Common section headers (exact or near-exact match, case-insensitive)
  const sectionHeaders = [
    'requirements', 'deliverables', 'responsibilities', 'qualifications',
    'about', 'about us', 'about the role', 'about the company', 'about the team',
    'overview', 'description', 'summary', 'key responsibilities',
    'what you\'ll do', 'what we\'re looking for', 'what we offer',
    'what you\'ll need', 'what you bring', 'what you will do',
    'who you are', 'who we are', 'why join us', 'why us',
    'benefits', 'perks', 'perks and benefits', 'compensation',
    'skills', 'required skills', 'preferred skills', 'technical skills',
    'experience', 'required experience', 'preferred experience',
    'education', 'nice to have', 'bonus points', 'preferred qualifications',
    'minimum qualifications', 'basic qualifications',
    'how to apply', 'application process', 'next steps',
    'equal opportunity', 'equal opportunity employer',
  ];

  const lower = trimmed.toLowerCase().replace(/:$/, '');
  if (sectionHeaders.includes(lower)) return true;

  // Short all-caps or title-case lines (< 60 chars, no periods) are likely headings
  if (trimmed.length <= 60 && !trimmed.includes('.') && /^[A-Z][A-Za-z\s/&,'-]+$/.test(trimmed)) {
    // At least 2 chars, not a full sentence
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount <= 6) return true;
  }

  return false;
}

function FormattedDescription({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-3" />;

        if (isHeadingLine(trimmed)) {
          return (
            <p key={i} className="text-white/80 font-semibold mt-4 mb-1 first:mt-0">
              {trimmed}
            </p>
          );
        }

        return (
          <p key={i} className="text-white/60">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

function CompanyDataSection({ data }: { data: NonNullable<Job['companyData']> }) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'Industry', value: data.industry },
    { label: 'Website', value: data.website },
    { label: 'Headquarters', value: data.headquarters },
    { label: 'Employees', value: data.employeeCountRange || data.employeeCount?.toLocaleString() },
    { label: 'Founded', value: data.founded?.toString() || data.foundedYear?.toString() },
    { label: 'Type', value: data.companyType },
    { label: 'Funding', value: data.fundingStage },
    { label: 'Revenue', value: data.revenue },
    { label: 'Phone', value: data.phone },
  ];

  const activeFields = fields.filter((f) => f.value);
  const hasTech = data.technologies && data.technologies.length > 0;
  const hasSpecialties = data.specialties && data.specialties.length > 0;
  const hasDescription = data.description || data.tagline;

  if (activeFields.length === 0 && !hasTech && !hasSpecialties && !hasDescription) return null;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
        <BuildingIcon className="w-3.5 h-3.5" />
        Company Intel
        <span className="text-[10px] font-normal text-emerald-400/80 ml-auto">Enriched</span>
      </h3>

      {(data.tagline || data.description) && (
        <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
          {data.tagline || data.description}
        </p>
      )}

      {activeFields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {activeFields.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-[10px] text-white/30">{label}</span>
              <span className="text-xs text-white/70 truncate">
                {label === 'Website' ? (
                  <a
                    href={value!.startsWith('http') ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {value!.replace(/^https?:\/\//, '')}
                  </a>
                ) : value}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasTech && (
        <div>
          <span className="text-[10px] text-white/30">Tech Stack</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.technologies!.slice(0, 12).map((tech) => (
              <span key={tech} className="px-2 py-0.5 rounded-md text-[10px] bg-primary/10 text-primary-300 border border-primary/20">
                {tech}
              </span>
            ))}
            {data.technologies!.length > 12 && (
              <span className="px-2 py-0.5 text-[10px] text-white/30">
                +{data.technologies!.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {hasSpecialties && (
        <div>
          <span className="text-[10px] text-white/30">Specialties</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.specialties!.slice(0, 8).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] text-white/50 border border-white/[0.06]">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionMakersSection({ contacts }: { contacts: Person[] }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
        <UsersIcon className="w-3.5 h-3.5" />
        Decision Makers
        <span className="text-[10px] font-normal text-white/30 ml-auto">{contacts.length} found</span>
      </h3>

      <div className="space-y-2.5">
        {contacts.map((person, i) => (
          <div key={`${person.name}-${i}`} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-400 font-medium text-xs">
                {person.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80 font-medium truncate">{person.name}</span>
                {person.linkedInUrl && (
                  <a
                    href={person.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/30 hover:text-primary-400 transition-colors flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${person.name} LinkedIn`}
                  >
                    <LinkedInIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-white/40 truncate">{person.title}</p>
              {person.email && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MailIcon className="w-3 h-3 text-white/30" />
                  <a
                    href={`mailto:${person.email}`}
                    className="text-xs text-primary-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {person.email}
                  </a>
                  <VerifiedBadge />
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <PhoneIcon className="w-3 h-3 text-white/30" />
                  <span className="text-xs text-white/50">{person.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
      <CheckCircleIcon className="w-2.5 h-2.5" />
      Verified
    </span>
  );
}

function MetaPill({ icon, label, highlight }: { icon?: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${
      highlight ? 'bg-primary/15 text-primary-300 border border-primary/30' : 'bg-white/5 text-white/50 border border-white/10'
    }`}>
      {icon}
      {label}
    </span>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" />
      <path d="M8 10h.01" /><path d="M16 10h.01" />
      <path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
