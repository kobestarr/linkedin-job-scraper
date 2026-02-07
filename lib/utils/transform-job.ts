import type { Job } from '@/types';

/**
 * Strip tracking parameters from LinkedIn URLs.
 */
function cleanLinkedInUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('linkedin.com')) {
      return `${parsed.origin}${parsed.pathname}`;
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Parse applicant count from string like "Be among the first 25 applicants"
 */
function parseApplicantCount(raw: unknown): number | undefined {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string' || !raw) return undefined;
  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Format salaryInfo array into readable string.
 */
function formatSalary(raw: unknown): string | undefined {
  if (!Array.isArray(raw) || raw.length === 0) {
    if (typeof raw === 'string' && raw) return raw;
    return undefined;
  }
  const formatted = raw.map((v: string) => {
    const num = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return v;
    const currency = String(v).match(/^[^0-9]*/)?.[0] || '$';
    if (num >= 1000) return `${currency}${Math.round(num / 1000)}K`;
    return `${currency}${num}`;
  });
  if (formatted.length === 1) return formatted[0];
  return `${formatted[0]} - ${formatted[1]}`;
}

/**
 * Strip LinkedIn boilerplate from descriptions
 */
function cleanDescription(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/\s*Show more Show less\s*$/i, '').trim() || undefined;
}

/**
 * Transform a raw Apify item into our Job type.
 */
/**
 * Generate a deterministic ID from job data to avoid hydration mismatches.
 */
function generateJobId(item: Record<string, unknown>): string {
  const jobId = (item.jobId as string) || (item.id as string);
  if (jobId) return jobId;
  
  // Deterministic fallback using available data (avoids Math.random for SSR)
  const company = String(item.companyName || item.company || 'unknown').toLowerCase().replace(/\s+/g, '-');
  const title = String(item.jobTitle || item.title || 'unknown').toLowerCase().replace(/\s+/g, '-');
  const date = String(item.publishedAt || item.postedAt || Date.now()).slice(0, 10);
  return `${company}-${title}-${date}`.replace(/[^a-z0-9-]/g, '').slice(0, 100);
}

export function transformApifyJob(item: Record<string, unknown>): Job {
  return {
    id: generateJobId(item),
    title: (item.jobTitle as string) || (item.title as string) || 'Unknown Title',
    company: (item.companyName as string) || (item.company as string) || 'Unknown Company',
    companyUrl: item.companyUrl as string | undefined,
    companyLinkedIn: item.companyLinkedIn as string | undefined,
    companyLogo: item.companyLogo as string | undefined,
    location: (item.location as string) || 'Unknown Location',
    postedAt: (item.publishedAt as string) || (item.postedAt as string) || new Date().toISOString(),
    postedAtRelative: (item.postedTime as string) || (item.postedAtRelative as string) || undefined,
    url: cleanLinkedInUrl((item.jobUrl as string) || (item.url as string) || '#'),
    description: cleanDescription((item.jobDescription as string) || (item.description as string)),
    salary: formatSalary(item.salaryInfo ?? item.salary),
    employmentType: (item.contractType as string) || (item.employmentType as string) || undefined,
    experienceLevel: (item.experienceLevel as string) || undefined,
    applicantCount: parseApplicantCount(item.applicationsCount ?? item.applicantCount),
  };
}
