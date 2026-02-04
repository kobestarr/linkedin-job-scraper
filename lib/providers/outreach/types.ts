/**
 * OutreachProvider Interface
 *
 * Abstracts lead export and outreach integration. MVP uses CSV export,
 * but can be swapped to Smartlead, Instantly, Lemlist, etc.
 */

import type { Job } from '@/types';
import type { EnrichedJob } from '../enrichment/types';

export interface ExportOptions {
  format?: 'csv' | 'json' | 'xlsx';
  filename?: string;
  fields?: (keyof Job | keyof EnrichedJob)[];
  includeEnrichment?: boolean;
}

export interface CampaignConfig {
  name: string;
  sequence?: string;
  sendingLimit?: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  leadCount: number;
  createdAt: string;
}

export interface OutreachProvider {
  /**
   * Unique identifier for this provider
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Export leads to file (download)
   */
  exportLeads(leads: (Job | EnrichedJob)[], options?: ExportOptions): Promise<void>;

  /**
   * Push leads directly to outreach platform
   */
  pushLeads?(leads: EnrichedJob[]): Promise<{ success: number; failed: number }>;

  /**
   * Create a campaign in the outreach platform
   */
  createCampaign?(config: CampaignConfig): Promise<Campaign>;

  /**
   * Check if the provider is configured and ready
   */
  isConfigured(): Promise<boolean>;
}
