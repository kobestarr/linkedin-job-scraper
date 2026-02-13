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
  // Deduplication & signal fields
  dedupeKey?: string;
  isRepeatHiring?: boolean;
  repeatCount?: number;
  // Post-processing flags
  isRecruiter?: boolean;
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

// Employment type options
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';

export const EMPLOYMENT_TYPE_CONFIG: Record<EmploymentType, { label: string }> = {
  'full-time':  { label: 'Full-time' },
  'part-time':  { label: 'Part-time' },
  'contract':   { label: 'Contract' },
  'freelance':  { label: 'Freelance' },
  'internship': { label: 'Internship' },
};

// Pay range options — salary, day-rate, and hourly all cross-mapped
// Equivalence: annual / 250 working days = day rate; day rate / 8 hours = hourly
export type PayRange =
  | 'under30k' | '30k-50k' | '50k-75k' | '75k-100k' | '100k-150k' | '150k+'
  | 'day-0-250' | 'day-250-500' | 'day-500-750' | 'day-750+'
  | 'hr-0-15' | 'hr-15-30' | 'hr-30-50' | 'hr-50-75' | 'hr-75+';

export interface PayRangeEntry {
  label: string;
  group: 'salary' | 'day-rate' | 'hourly';
  /** Annual salary equivalent range [min, max] for cross-matching */
  annualMin: number;
  annualMax: number;
}

export const PAY_RANGE_CONFIG: Record<PayRange, PayRangeEntry> = {
  // Salary bands
  'under30k':    { label: 'Under {c}30k',      group: 'salary',   annualMin: 0,      annualMax: 30000 },
  '30k-50k':     { label: '{c}30k – {c}50k',   group: 'salary',   annualMin: 30000,  annualMax: 50000 },
  '50k-75k':     { label: '{c}50k – {c}75k',   group: 'salary',   annualMin: 50000,  annualMax: 75000 },
  '75k-100k':    { label: '{c}75k – {c}100k',  group: 'salary',   annualMin: 75000,  annualMax: 100000 },
  '100k-150k':   { label: '{c}100k – {c}150k', group: 'salary',   annualMin: 100000, annualMax: 150000 },
  '150k+':       { label: '{c}150k+',          group: 'salary',   annualMin: 150000, annualMax: Infinity },
  // Day rates (annual / 250 working days)
  'day-0-250':   { label: '{c}0 – {c}250/day',     group: 'day-rate', annualMin: 0,      annualMax: 62500 },
  'day-250-500': { label: '{c}250 – {c}500/day',   group: 'day-rate', annualMin: 62500,  annualMax: 125000 },
  'day-500-750': { label: '{c}500 – {c}750/day',   group: 'day-rate', annualMin: 125000, annualMax: 187500 },
  'day-750+':    { label: '{c}750+/day',            group: 'day-rate', annualMin: 187500, annualMax: Infinity },
  // Hourly rates (annual / 250 / 8)
  'hr-0-15':     { label: '{c}0 – {c}15/hr',       group: 'hourly',   annualMin: 0,      annualMax: 30000 },
  'hr-15-30':    { label: '{c}15 – {c}30/hr',      group: 'hourly',   annualMin: 30000,  annualMax: 60000 },
  'hr-30-50':    { label: '{c}30 – {c}50/hr',      group: 'hourly',   annualMin: 60000,  annualMax: 100000 },
  'hr-50-75':    { label: '{c}50 – {c}75/hr',      group: 'hourly',   annualMin: 100000, annualMax: 150000 },
  'hr-75+':      { label: '{c}75+/hr',             group: 'hourly',   annualMin: 150000, annualMax: Infinity },
};

/**
 * Given selected pay ranges, returns the full set including equivalent ranges
 * from other groups that overlap in annual salary terms.
 */
export function getEquivalentPayRanges(selected: PayRange[]): PayRange[] {
  if (selected.length === 0) return [];

  // Compute the union of annual ranges from all selected brackets
  let unionMin = Infinity;
  let unionMax = -Infinity;
  for (const pr of selected) {
    const entry = PAY_RANGE_CONFIG[pr];
    if (entry.annualMin < unionMin) unionMin = entry.annualMin;
    if (entry.annualMax > unionMax) unionMax = entry.annualMax;
  }

  // Find all pay ranges whose annual band overlaps with the union
  const all = Object.keys(PAY_RANGE_CONFIG) as PayRange[];
  return all.filter((pr) => {
    const entry = PAY_RANGE_CONFIG[pr];
    return entry.annualMin < unionMax && entry.annualMax > unionMin;
  });
}

// Currency config per location
export interface CurrencyConfig {
  symbol: string;
  code: string;
}

export const LOCATION_CURRENCY: Record<string, CurrencyConfig> = {
  'United Kingdom': { symbol: '\u00A3', code: 'GBP' },
  'United States':  { symbol: '$', code: 'USD' },
  'Germany':        { symbol: '\u20AC', code: 'EUR' },
  'Netherlands':    { symbol: '\u20AC', code: 'EUR' },
  'France':         { symbol: '\u20AC', code: 'EUR' },
  'Australia':      { symbol: 'A$', code: 'AUD' },
  'Canada':         { symbol: 'C$', code: 'CAD' },
  'Remote':         { symbol: '$', code: 'USD' },
};

export const DEFAULT_CURRENCY: CurrencyConfig = { symbol: '\u00A3', code: 'GBP' };

/** Look up currency for a location string (handles city-level like "London, United Kingdom") */
export function getCurrencyForLocation(location: string): CurrencyConfig {
  // Direct match first
  if (LOCATION_CURRENCY[location]) return LOCATION_CURRENCY[location];
  // Check if location contains a known country (e.g. "London, United Kingdom")
  for (const [country, currency] of Object.entries(LOCATION_CURRENCY)) {
    if (location.includes(country)) return currency;
  }
  // US state abbreviations (e.g. "New York, NY")
  if (/,\s*[A-Z]{2}$/.test(location)) return LOCATION_CURRENCY['United States'];
  return DEFAULT_CURRENCY;
}

/** Resolve a pay range label with the correct currency symbol */
export function formatPayLabel(label: string, currency: CurrencyConfig): string {
  return label.replace(/\{c\}/g, currency.symbol);
}

// Date range options
export type DateRange = '24h' | '3d' | '7d' | '14d' | '30d';

export const DATE_RANGE_CONFIG: Record<DateRange, { label: string; tooltip: string; emoji?: string }> = {
  '24h': {
    label: 'Last 24 hours',
    tooltip: 'Posted today. Highest intent - they are actively reviewing candidates right now.',
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

// Sorting
export type SortOption = 'recent' | 'salary-high' | 'applicants' | 'company-az' | 'relevance' | 'prime-picks';

export const SORT_CONFIG: Record<SortOption, { label: string }> = {
  'recent':      { label: 'Most Recent' },
  'salary-high': { label: 'Highest Salary' },
  'applicants':  { label: 'Most Applicants' },
  'company-az':  { label: 'Company A-Z' },
  'relevance':   { label: 'Best Match' },
  'prime-picks': { label: 'Prime Picks' },
};

// Match mode for keyword filtering
export type MatchMode = 'all-title' | 'all-anywhere' | 'exact-title' | 'broad' | 'off';

export const MATCH_MODE_CONFIG: Record<MatchMode, { label: string; description: string }> = {
  'exact-title':  { label: 'Exact Title',      description: 'Exact phrase must appear in job title' },
  'all-title':    { label: 'Title Keywords',    description: 'All keywords must appear in job title' },
  'all-anywhere': { label: 'Title + Description', description: 'All keywords must appear in title or description' },
  'broad':        { label: 'Broad Match',       description: 'Any keyword in title or description' },
  'off':          { label: 'No Filter',         description: 'Show all results from LinkedIn' },
};

// View mode
export type ViewMode = 'list' | 'card';

// Auto-refresh intervals
export type AutoRefreshInterval = '30m' | '1h' | '2h' | '4h' | 'off';

export const AUTO_REFRESH_CONFIG: Record<AutoRefreshInterval, { label: string; ms: number | null }> = {
  '30m': { label: 'Every 30 min', ms: 30 * 60 * 1000 },
  '1h':  { label: 'Every hour',   ms: 60 * 60 * 1000 },
  '2h':  { label: 'Every 2 hours', ms: 2 * 60 * 60 * 1000 },
  '4h':  { label: 'Every 4 hours', ms: 4 * 60 * 60 * 1000 },
  'off': { label: 'Off',          ms: null },
};

// Location presets with cities / regions
export interface LocationPreset {
  value: string;
  label: string;
  regions?: { value: string; label: string }[];
}

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    value: 'United Kingdom', label: 'United Kingdom',
    regions: [
      { value: 'London, United Kingdom', label: 'London' },
      { value: 'Manchester, United Kingdom', label: 'Manchester' },
      { value: 'Birmingham, United Kingdom', label: 'Birmingham' },
      { value: 'Leeds, United Kingdom', label: 'Leeds' },
      { value: 'Edinburgh, United Kingdom', label: 'Edinburgh' },
      { value: 'Bristol, United Kingdom', label: 'Bristol' },
      { value: 'Glasgow, United Kingdom', label: 'Glasgow' },
      { value: 'Cambridge, United Kingdom', label: 'Cambridge' },
    ],
  },
  {
    value: 'United States', label: 'United States',
    regions: [
      { value: 'New York, NY', label: 'New York' },
      { value: 'San Francisco, CA', label: 'San Francisco' },
      { value: 'Los Angeles, CA', label: 'Los Angeles' },
      { value: 'Chicago, IL', label: 'Chicago' },
      { value: 'Austin, TX', label: 'Austin' },
      { value: 'Seattle, WA', label: 'Seattle' },
      { value: 'Boston, MA', label: 'Boston' },
      { value: 'Miami, FL', label: 'Miami' },
    ],
  },
  {
    value: 'Germany', label: 'Germany',
    regions: [
      { value: 'Berlin, Germany', label: 'Berlin' },
      { value: 'Munich, Germany', label: 'Munich' },
      { value: 'Hamburg, Germany', label: 'Hamburg' },
      { value: 'Frankfurt, Germany', label: 'Frankfurt' },
    ],
  },
  {
    value: 'Netherlands', label: 'Netherlands',
    regions: [
      { value: 'Amsterdam, Netherlands', label: 'Amsterdam' },
      { value: 'Rotterdam, Netherlands', label: 'Rotterdam' },
      { value: 'The Hague, Netherlands', label: 'The Hague' },
      { value: 'Eindhoven, Netherlands', label: 'Eindhoven' },
    ],
  },
  {
    value: 'France', label: 'France',
    regions: [
      { value: 'Paris, France', label: 'Paris' },
      { value: 'Lyon, France', label: 'Lyon' },
      { value: 'Marseille, France', label: 'Marseille' },
      { value: 'Toulouse, France', label: 'Toulouse' },
    ],
  },
  {
    value: 'Australia', label: 'Australia',
    regions: [
      { value: 'Sydney, Australia', label: 'Sydney' },
      { value: 'Melbourne, Australia', label: 'Melbourne' },
      { value: 'Brisbane, Australia', label: 'Brisbane' },
      { value: 'Perth, Australia', label: 'Perth' },
    ],
  },
  {
    value: 'Canada', label: 'Canada',
    regions: [
      { value: 'Toronto, Canada', label: 'Toronto' },
      { value: 'Vancouver, Canada', label: 'Vancouver' },
      { value: 'Montreal, Canada', label: 'Montreal' },
      { value: 'Ottawa, Canada', label: 'Ottawa' },
    ],
  },
  { value: 'Remote', label: 'Remote' },
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
