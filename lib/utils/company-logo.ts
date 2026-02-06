import type { Job } from '@/types';

/**
 * Build a logo URL for a company.
 * Priority: existing companyLogo > Clearbit from companyUrl domain > null (letter fallback)
 */
export function getCompanyLogoUrl(job: Pick<Job, 'companyLogo' | 'companyUrl' | 'company'>): string | null {
  if (job.companyLogo) return job.companyLogo;

  if (job.companyUrl) {
    try {
      const domain = new URL(job.companyUrl).hostname.replace('www.', '');
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      // malformed URL, fall through
    }
  }

  return null;
}
