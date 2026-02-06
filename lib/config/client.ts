/**
 * Client Configuration
 *
 * Environment-based config for multi-instance deployments.
 * Each client deployment gets different env vars — no code forks needed.
 */

export interface ClientConfig {
  name: string;
  theme: {
    appTitle: string;
    logoUrl?: string;
    primaryColor: string;
  };
  features: {
    showEnrichment: boolean;
    showOutreach: boolean;
  };
  defaults: {
    jobTitle?: string;
    location?: string;
    maxResults?: number;
  };
}

function getEnv(key: string, fallback: string): string {
  return (typeof window !== 'undefined'
    ? process.env[key]
    : process.env[key]) || fallback;
}

export function getClientConfig(): ClientConfig {
  return {
    name: getEnv('NEXT_PUBLIC_CLIENT_NAME', 'default'),
    theme: {
      appTitle: getEnv('NEXT_PUBLIC_APP_TITLE', 'Job Intelligence'),
      logoUrl: getEnv('NEXT_PUBLIC_LOGO_URL', '') || undefined,
      primaryColor: getEnv('NEXT_PUBLIC_PRIMARY_COLOR', '99 102 241'),
    },
    features: {
      showEnrichment: getEnv('NEXT_PUBLIC_ENRICHMENT', 'none') !== 'none',
      showOutreach: getEnv('NEXT_PUBLIC_OUTREACH', 'csv') !== 'csv',
    },
    defaults: {
      jobTitle: getEnv('NEXT_PUBLIC_DEFAULT_JOB_TITLE', '') || undefined,
      location: getEnv('NEXT_PUBLIC_DEFAULT_LOCATION', '') || undefined,
      maxResults: parseInt(getEnv('NEXT_PUBLIC_DEFAULT_MAX_RESULTS', '150'), 10),
    },
  };
}
