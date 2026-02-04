/**
 * Outreach Provider Factory
 */

import type { OutreachProvider } from './types';
import { CsvExportProvider } from './csv-export';

export type OutreachType = 'csv' | 'smartlead' | 'instantly';

const providers: Record<OutreachType, () => OutreachProvider> = {
  csv: () => new CsvExportProvider(),
  smartlead: () => {
    // Phase 3: Implement Smartlead provider
    throw new Error('Smartlead outreach provider not yet implemented');
  },
  instantly: () => {
    // Phase 3: Implement Instantly provider
    throw new Error('Instantly outreach provider not yet implemented');
  },
};

let instance: OutreachProvider | null = null;

export function getOutreachProvider(): OutreachProvider {
  if (instance) return instance;

  const type = (process.env.NEXT_PUBLIC_OUTREACH || 'csv') as OutreachType;

  if (!providers[type]) {
    throw new Error(`Unknown outreach provider: ${type}`);
  }

  instance = providers[type]();
  return instance;
}

export { type OutreachProvider, type ExportOptions } from './types';
