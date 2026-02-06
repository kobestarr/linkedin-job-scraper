import type { Job } from '@/types';

export type PowerTier = 'power' | 'strong' | null;

export interface PowerLeadResult {
  score: number;    // 0-10
  tier: PowerTier;
  reasons: string[];
}

/**
 * Compute a "Power Lead" score for a job based on opportunity signals.
 *
 * Signals:
 *  - Low applicants (less competition, faster hiring)
 *  - Very recent posting (active urgency)
 *  - Salary listed (transparency, serious employer)
 *  - Higher salary (bigger opportunity)
 */
export function computePowerScore(job: Job): PowerLeadResult {
  let score = 0;
  const reasons: string[] = [];

  // --- Applicant count (max 3 pts) ---
  if (job.applicantCount !== undefined && job.applicantCount > 0) {
    if (job.applicantCount < 10) {
      score += 3;
      reasons.push('Very few applicants');
    } else if (job.applicantCount < 25) {
      score += 2;
      reasons.push('Low competition');
    } else if (job.applicantCount < 50) {
      score += 1;
      reasons.push('Moderate competition');
    }
  } else {
    // No applicant data — give benefit of the doubt
    score += 1;
  }

  // --- Recency (max 3 pts) ---
  const hoursAgo = getHoursAgo(job);
  if (hoursAgo !== null) {
    if (hoursAgo < 24) {
      score += 3;
      reasons.push('Posted today');
    } else if (hoursAgo < 72) {
      score += 2;
      reasons.push('Posted this week');
    } else if (hoursAgo < 168) {
      score += 1;
    }
  }

  // --- Salary (max 3 pts) ---
  if (job.salary) {
    score += 2;
    reasons.push('Salary listed');

    // Bonus for higher salary
    const num = parseFirstNumber(job.salary);
    if (num >= 100000) {
      score += 1;
      reasons.push('High salary');
    }
  }

  // --- Easy apply / direct (max 1 pt) ---
  // If applicant count is shown and low, it's likely easy apply
  // (We don't have applyType on the Job type, but this is captured by low applicants above)

  // Clamp to 10
  score = Math.min(score, 10);

  // Determine tier
  let tier: PowerTier = null;
  if (score >= 7) {
    tier = 'power';
  } else if (score >= 4) {
    tier = 'strong';
  }

  return { score, tier, reasons };
}

function getHoursAgo(job: Job): number | null {
  // Try relative time string first
  if (job.postedAtRelative) {
    const rel = job.postedAtRelative.toLowerCase();
    const numMatch = rel.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (rel.includes('minute') || rel.includes('min')) return num / 60;
      if (rel.includes('hour') || rel.includes('hr')) return num;
      if (rel.includes('day')) return num * 24;
      if (rel.includes('week')) return num * 168;
      if (rel.includes('month')) return num * 720;
    }
  }

  // Fall back to postedAt date
  if (job.postedAt) {
    const posted = new Date(job.postedAt).getTime();
    if (!isNaN(posted)) {
      return (Date.now() - posted) / (1000 * 60 * 60);
    }
  }

  return null;
}

function parseFirstNumber(salary: string): number {
  const cleaned = salary.replace(/[£$€,]/g, '');
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  let num = parseFloat(match[1]);
  if (/\d+k/i.test(cleaned)) num *= 1000;
  return num;
}

/**
 * Get a clean description preview, stripping common metadata headers
 * that LinkedIn descriptions often start with.
 */
export function getDescriptionPreview(description?: string): string | null {
  if (!description) return null;

  // Lines that are purely metadata (key: value format with known keys)
  const metadataPatterns = [
    /^(position|role|title|job title)\s*:/i,
    /^(location|city|region)\s*:/i,
    /^(duration|contract length|contract duration)\s*:/i,
    /^(salary|compensation|pay|rate)\s*:/i,
    /^(company|employer|client)\s*:/i,
    /^(industry|sector)\s*:/i,
    /^(specialty|competency)\s*[:/]/i,
    /^(department|team|division)\s*:/i,
    /^(time type|work type|job type|employment type)\s*:/i,
    /^(travel requirements?|travel)\s*:/i,
    /^(start date|start)\s*:/i,
    /^(reports? to|reporting to)\s*:/i,
  ];

  const lines = description.split('\n');
  let startIndex = 0;

  // Skip leading metadata lines
  for (let i = 0; i < lines.length && i < 10; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      startIndex = i + 1;
      continue;
    }
    const isMetadata = metadataPatterns.some((p) => p.test(trimmed));
    if (isMetadata) {
      startIndex = i + 1;
    } else {
      break;
    }
  }

  // Join remaining lines, collapse whitespace
  const preview = lines
    .slice(startIndex)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return preview || description.replace(/\s+/g, ' ').trim();
}
