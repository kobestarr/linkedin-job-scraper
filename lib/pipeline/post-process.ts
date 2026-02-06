import type { Job, CompanySize, SortOption } from '@/types';

export interface PostProcessOptions {
  excludeRecruiters: boolean;
  excludeCompanies: string[];
  companySizes: CompanySize[];
  existingDedupeKeys?: Set<string>;
}

export interface ClientFilterOptions {
  excludeRecruiters: boolean;
  excludeCompanies: string[];
  companySizes: CompanySize[];
  mustContainKeywords?: boolean;
  searchQuery?: string;
}

// Internal type for jobs that have been through dedupeKey generation
type ProcessedJob = Job & { dedupeKey: string };

const RECRUITER_KEYWORDS = [
  'recruitment', 'recruiting', 'recruiter', 'staffing',
  'talent acquisition', 'headhunter', 'placement',
  'hays', 'robert half', 'michael page', 'randstad',
  'adecco', 'manpower', 'kelly services', 'kforce',
  'reed', 'spencer ogden', 'page group', 'pagegroup',
  'hudson', 'antal', 'allegis', 'modis',
];

/**
 * Generate a deduplication key from job data.
 * Format: lowercase(company|title|YYYY-MM-DD)
 */
function generateDedupeKey(job: Job): string {
  const company = job.company.toLowerCase().trim();
  const title = job.title.toLowerCase().trim();
  const date = new Date(job.postedAt).toISOString().split('T')[0];
  return `${company}|${title}|${date}`;
}

/**
 * Flag duplicate jobs within a batch and track repeat counts.
 */
function flagDuplicates(jobs: ProcessedJob[]): ProcessedJob[] {
  const seen = new Map<string, number>();
  return jobs.map((job) => {
    const key = job.dedupeKey;
    const count = (seen.get(key) || 0) + 1;
    seen.set(key, count);
    return {
      ...job,
      isRepeatHiring: count > 1,
      repeatCount: count,
    };
  });
}

/**
 * Flag jobs whose dedupeKey appeared in previous scrapes.
 */
function flagRepeatHiring(jobs: ProcessedJob[], existingKeys: Set<string>): ProcessedJob[] {
  return jobs.map((job) => {
    if (existingKeys.has(job.dedupeKey)) {
      return { ...job, isRepeatHiring: true };
    }
    return job;
  });
}

/**
 * Detect recruiter postings via keyword matching on company name and description.
 */
function detectRecruiters(jobs: ProcessedJob[]): ProcessedJob[] {
  return jobs.map((job) => {
    const companyLower = job.company.toLowerCase();
    const descLower = (job.description || '').toLowerCase();

    const isRecruiter = RECRUITER_KEYWORDS.some(
      (keyword) => companyLower.includes(keyword) || descLower.includes(keyword)
    );

    return { ...job, isRecruiter };
  });
}

/**
 * Full post-processing pipeline. Runs detection and flagging on all jobs,
 * then returns the full set with flags attached (exclusion is separate).
 */
export function postProcessJobs(jobs: Job[], options: PostProcessOptions): Job[] {
  // 1. Generate dedupeKeys
  let result: ProcessedJob[] = jobs.map((job) => ({
    ...job,
    dedupeKey: generateDedupeKey(job),
  }));

  // 2. Flag duplicates within this batch
  result = flagDuplicates(result);

  // 3. Flag repeat hiring signals from previous scrapes
  if (options.existingDedupeKeys && options.existingDedupeKeys.size > 0) {
    result = flagRepeatHiring(result, options.existingDedupeKeys);
  }

  // 4. Detect recruiters
  result = detectRecruiters(result);

  return result;
}

/**
 * Apply client-side exclusion filters on already-processed jobs.
 * This runs instantly when filter toggles change without re-fetching.
 */
export function applyClientFilters(
  jobs: Job[],
  options: ClientFilterOptions
): Job[] {
  let result = jobs;

  // Exclude recruiters
  if (options.excludeRecruiters) {
    result = result.filter((job) => !job.isRecruiter);
  }

  // Exclude companies
  if (options.excludeCompanies.length > 0) {
    const excludeLower = options.excludeCompanies.map((c) => c.toLowerCase());
    result = result.filter(
      (job) => !excludeLower.some((exc) => job.company.toLowerCase().includes(exc))
    );
  }

  // Filter by company size (best-effort: pass through if no size data)
  if (options.companySizes.length > 0) {
    result = result.filter((job) => {
      if (!job.applicantCount) return true;
      return true;
    });
  }

  // Must-contain keyword filter
  if (options.mustContainKeywords && options.searchQuery) {
    const words = options.searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length > 0) {
      result = result.filter((job) => {
        const titleLower = job.title.toLowerCase();
        const descLower = (job.description || '').toLowerCase();
        return words.some((w) => titleLower.includes(w) || descLower.includes(w));
      });
    }
  }

  return result;
}

/**
 * Parse a salary string to extract the first numeric value (annual equivalent).
 * Returns -1 if no number found (sorts to bottom).
 */
function parseSalaryNumeric(salary?: string): number {
  if (!salary) return -1;
  const cleaned = salary.replace(/[£$€,]/g, '');
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return -1;
  let num = parseFloat(match[1]);
  if (/\d+k/i.test(cleaned)) num *= 1000;
  if (num < 200 && /hr|hour|per hour/i.test(salary)) num *= 2000;
  if (num >= 200 && num <= 2000 && /day|daily|per day/i.test(salary)) num *= 250;
  return num;
}

/**
 * Score a job's relevance to a search query based on keyword density.
 */
function keywordScore(job: Job, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  let score = 0;
  for (const word of words) {
    if (titleLower.includes(word)) score += 2;
    if (descLower.includes(word)) score += 1;
  }
  return score;
}

/**
 * Sort jobs by the selected sort option.
 */
export function applySorting(jobs: Job[], sortBy: SortOption, searchQuery?: string): Job[] {
  const sorted = [...jobs];
  switch (sortBy) {
    case 'recent':
      sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      break;
    case 'salary-high':
      sorted.sort((a, b) => parseSalaryNumeric(b.salary) - parseSalaryNumeric(a.salary));
      break;
    case 'applicants':
      sorted.sort((a, b) => (b.applicantCount ?? 0) - (a.applicantCount ?? 0));
      break;
    case 'company-az':
      sorted.sort((a, b) => a.company.localeCompare(b.company));
      break;
    case 'relevance':
      if (searchQuery) {
        sorted.sort((a, b) => keywordScore(b, searchQuery) - keywordScore(a, searchQuery));
      }
      break;
  }
  return sorted;
}
