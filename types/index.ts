/**
 * Core type definitions for LinkedIn Job Intelligence Platform
 */

// Job data from Apify scraper
export interface Job {
  id: string;
  title: string;
  company: string;
  companyUrl?: string;
  companyLinkedIn?: string;
  companyLogo?: string;
  location: string;
  postedAt: string;        // ISO date string
  postedAtRelative?: string; // "2 days ago"
  url: string;
  description?: string;
  salary?: string;
  employmentType?: string; // "Full-time", "Contract", etc.
  experienceLevel?: string;
  applicantCount?: number;
  // Enrichment data (Phase 2)
  enriched?: boolean;
  decisionMakers?: Person[];
}

// Person data from enrichment
export interface Person {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
}

// Filter state
export interface JobFilters {
  mustContain?: string[];
  exclude?: string[];
  companySize?: CompanySize[];
  seniority?: Seniority[];
  companyExclude?: string[];
  dateRange?: DateRange;
  location?: string[];
}

// Company size tiers
export type CompanySize = 'startup' | 'smb' | 'midmarket' | 'enterprise';

export const COMPANY_SIZE_CONFIG: Record<CompanySize, { min: number; max: number; label: string; tooltip: string }> = {
  startup: {
    min: 1,
    max: 50,
    label: 'Startup (1-50)',
    tooltip: 'Early-stage companies. Fast to close but smaller deal sizes. Great for landing first logos.',
  },
  smb: {
    min: 51,
    max: 500,
    label: 'SMB (51-500)',
    tooltip: 'Small-to-medium businesses. Often the ideal target: real budget, faster procurement, less red tape.',
  },
  midmarket: {
    min: 501,
    max: 2000,
    label: 'Mid-Market (501-2K)',
    tooltip: 'Growing companies with established budgets. May have procurement process but not enterprise complexity.',
  },
  enterprise: {
    min: 2001,
    max: Infinity,
    label: 'Enterprise (2K+)',
    tooltip: 'Large organizations. Bigger deals but expect longer sales cycles, legal review, and multiple decision-makers.',
  },
};

// Seniority levels
export type Seniority = 'entry' | 'mid' | 'senior' | 'executive';

export const SENIORITY_CONFIG: Record<Seniority, { keywords: string[]; label: string; tooltip: string }> = {
  entry: {
    keywords: ['junior', 'associate', 'intern', 'trainee', 'graduate', 'entry'],
    label: 'Entry',
    tooltip: 'Entry-level positions. Companies hiring here have immediate capacity needs—fast decisions.',
  },
  mid: {
    keywords: ['specialist', 'administrator', 'developer', 'analyst', 'coordinator'],
    label: 'Mid',
    tooltip: 'Mid-level roles. Solid indicator of active projects. Standard 2-4 week hiring cycles.',
  },
  senior: {
    keywords: ['senior', 'lead', 'manager', 'principal', 'staff'],
    label: 'Senior',
    tooltip: 'Senior individual contributors. Slightly longer hiring process, but still operational need.',
  },
  executive: {
    keywords: ['director', 'head of', 'vp', 'vice president', 'chief', 'cto', 'cfo', 'ceo'],
    label: 'Executive',
    tooltip: 'Leadership roles. Expect 2-6 month hiring cycles. Great for enterprise sales targeting.',
  },
};

// Date range options
export type DateRange = '24h' | '3d' | '7d' | '14d' | '30d';

export const DATE_RANGE_CONFIG: Record<DateRange, { label: string; tooltip: string; emoji?: string }> = {
  '24h': {
    label: 'Last 24 hours',
    tooltip: 'Posted today. Highest intent—they're actively reviewing candidates right now.',
    emoji: '🔥',
  },
  '3d': {
    label: 'Last 3 days',
    tooltip: 'Very recent postings. High likelihood the role is still open and urgent.',
  },
  '7d': {
    label: 'Last 7 days',
    tooltip: 'Posted this week. Good balance of recency and volume.',
  },
  '14d': {
    label: 'Last 14 days',
    tooltip: 'Posted in last 2 weeks. May still be open but competition increasing.',
  },
  '30d': {
    label: 'Last 30 days',
    tooltip: 'Older postings. Role may be filled or hiring paused. Use for research.',
  },
};

// Filter presets (Sales Playbooks)
export interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  filters: Partial<JobFilters>;
  isDefault?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'quick-wins',
    name: 'Quick Wins',
    icon: '🎯',
    description: 'SMBs hiring mid-level roles recently. Fast decisions, real budgets.',
    filters: {
      companySize: ['smb'],
      seniority: ['entry', 'mid'],
      dateRange: '3d',
      exclude: ['senior', 'architect', 'principal', 'director'],
    },
    isDefault: true,
  },
  {
    id: 'big-fish',
    name: 'Big Fish',
    icon: '🐋',
    description: 'Enterprise companies hiring senior roles. Bigger contracts, longer cycles.',
    filters: {
      companySize: ['enterprise'],
      seniority: ['senior', 'executive'],
      dateRange: '14d',
      exclude: ['junior', 'associate', 'intern'],
    },
    isDefault: true,
  },
  {
    id: 'hot-leads',
    name: 'Hot Leads',
    icon: '🔥',
    description: 'Posted in last 24 hours. They are hiring RIGHT NOW.',
    filters: {
      dateRange: '24h',
    },
    isDefault: true,
  },
  {
    id: 'no-competitors',
    name: 'No Competitors',
    icon: '🚫',
    description: 'Excludes Big 4, consulting firms, and rival platforms.',
    filters: {
      companyExclude: [
        'accenture', 'deloitte', 'kpmg', 'pwc', 'ey', 'capgemini',
        'mckinsey', 'bcg', 'bain', 'oracle', 'sap', 'microsoft',
      ],
    },
    isDefault: true,
  },
];

// Theme configuration for white-labeling
export interface Theme {
  id: string;
  name: string;
  logo?: {
    url: string;
    width: number;
    height: number;
  };
  colors: {
    primary: string;       // RGB values: "99 102 241"
    primaryHover?: string;
    accent?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
}
