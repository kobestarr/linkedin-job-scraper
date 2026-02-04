/**
 * CSV Export Implementation
 *
 * MVP outreach provider that exports leads to CSV file.
 */

import type { Job } from '@/types';
import type { EnrichedJob } from '../enrichment/types';
import type { OutreachProvider, ExportOptions } from './types';

export class CsvExportProvider implements OutreachProvider {
  readonly id = 'csv-export';
  readonly name = 'CSV Export';

  async exportLeads(leads: (Job | EnrichedJob)[], options?: ExportOptions): Promise<void> {
    const {
      filename = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`,
      fields,
    } = options || {};

    // Default fields to export
    const exportFields = fields || [
      'title',
      'company',
      'location',
      'postedAt',
      'url',
      'salary',
      'employmentType',
    ];

    // Generate CSV header
    const header = exportFields.join(',');

    // Generate CSV rows
    const rows = leads.map((lead) =>
      exportFields
        .map((field) => {
          const value = lead[field as keyof typeof lead];
          if (value === undefined || value === null) return '';
          // Escape commas and quotes
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    );

    const csv = [header, ...rows].join('\n');

    // Trigger download in browser
    if (typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  async isConfigured(): Promise<boolean> {
    // CSV export is always available
    return true;
  }
}
