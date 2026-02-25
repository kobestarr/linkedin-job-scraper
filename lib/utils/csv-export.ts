/**
 * CSV Export Utility
 *
 * Generates and downloads CSV files from job data, including enrichment fields.
 * Pure client-side — no API call needed.
 */

import type { Job } from '@/types';
import type { CompanyEnrichment } from '@/lib/providers/enrichment/types';

interface CsvColumn {
  header: string;
  accessor: (job: Job) => string;
}

/**
 * CSV column definitions — order determines column order in export.
 * Includes both base job fields and enrichment fields.
 */
const CSV_COLUMNS: CsvColumn[] = [
  // Core job data
  { header: 'Job Title', accessor: (j) => j.title },
  { header: 'Company', accessor: (j) => j.company },
  { header: 'Location', accessor: (j) => j.location },
  { header: 'URL', accessor: (j) => j.url },
  { header: 'Posted', accessor: (j) => j.postedAt },
  { header: 'Salary', accessor: (j) => j.salary ?? '' },
  { header: 'Employment Type', accessor: (j) => j.employmentType ?? '' },
  { header: 'Experience Level', accessor: (j) => j.experienceLevel ?? '' },
  { header: 'Applicants', accessor: (j) => j.applicantCount?.toString() ?? '' },
  { header: 'Recruiter Post', accessor: (j) => j.isRecruiter ? 'Yes' : '' },

  // Enrichment status
  { header: 'Enriched', accessor: (j) => j.enriched ? 'Yes' : '' },

  // Company enrichment data
  { header: 'Industry', accessor: (j) => j.companyData?.industry ?? '' },
  { header: 'Company Website', accessor: (j) => j.companyData?.website ?? '' },
  { header: 'Company LinkedIn', accessor: (j) => j.companyLinkedIn ?? j.companyData?.linkedInCompanyUrl ?? '' },
  { header: 'Employee Count', accessor: (j) => formatEmployeeCount(j.companyData) },
  { header: 'Headquarters', accessor: (j) => j.companyData?.headquarters ?? '' },
  { header: 'Founded', accessor: (j) => j.companyData?.founded?.toString() ?? j.companyData?.foundedYear?.toString() ?? '' },
  { header: 'Company Description', accessor: (j) => j.companyData?.description ?? '' },
  { header: 'Tagline', accessor: (j) => j.companyData?.tagline ?? '' },
  { header: 'Specialties', accessor: (j) => j.companyData?.specialties?.join('; ') ?? '' },
  { header: 'Technologies', accessor: (j) => j.companyData?.technologies?.join('; ') ?? '' },
  { header: 'Phone', accessor: (j) => j.companyData?.phone ?? '' },
  { header: 'Company Type', accessor: (j) => j.companyData?.companyType ?? '' },
  { header: 'Funding Stage', accessor: (j) => j.companyData?.fundingStage ?? '' },
  { header: 'Revenue', accessor: (j) => j.companyData?.revenue ?? '' },
  { header: 'Enrichment Source', accessor: (j) => j.companyData?.source ?? '' },

  // Decision makers (if present)
  { header: 'Decision Makers', accessor: (j) => formatDecisionMakers(j) },
];

function formatEmployeeCount(data?: CompanyEnrichment): string {
  if (!data) return '';
  if (data.employeeCountRange) return data.employeeCountRange;
  if (data.employeeCount) return data.employeeCount.toString();
  return '';
}

function formatDecisionMakers(job: Job): string {
  if (!job.decisionMakers?.length) return '';
  return job.decisionMakers
    .map((p) => {
      const parts = [p.name, p.title];
      if (p.email) parts.push(p.email);
      return parts.join(' - ');
    })
    .join('; ');
}

/**
 * Escape a value for CSV — wrap in quotes if it contains commas, quotes, or newlines.
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate CSV string from an array of jobs.
 */
export function generateCsv(jobs: Job[]): string {
  const header = CSV_COLUMNS.map((c) => escapeCsvValue(c.header)).join(',');

  const rows = jobs.map((job) =>
    CSV_COLUMNS.map((col) => escapeCsvValue(col.accessor(job))).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Trigger a browser download of a CSV file.
 */
export function downloadCsv(jobs: Job[], filename?: string): void {
  const csv = generateCsv(jobs);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `job-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
