/**
 * Test Suite for Data Processor
 * Run with: npm test
 */

const assert = require('assert');
const JobDataProcessor = require('./data-processor');

const processor = new JobDataProcessor();

console.log('Running tests...\n');

// Test counter
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// ============================================
// processJob tests
// ============================================

test('processJob: should process a valid job object', () => {
  const rawJob = {
    title: 'Software Engineer',
    company: 'Acme Corp',
    companyUrl: 'https://linkedin.com/company/acme',
    url: 'https://linkedin.com/jobs/123',
    location: 'San Francisco, CA',
    publishedAt: '2024-01-15T10:00:00Z',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-Senior',
    description: 'Great job opportunity'
  };

  const result = processor.processJob(rawJob, 'Software Engineer');

  assert.strictEqual(result.jobTitle, 'Software Engineer');
  assert.strictEqual(result.companyName, 'Acme Corp');
  assert.strictEqual(result.companyLinkedInUrl, 'https://linkedin.com/company/acme');
  assert.strictEqual(result.jobPostingUrl, 'https://linkedin.com/jobs/123');
  assert.strictEqual(result.location, 'San Francisco, CA');
  assert.strictEqual(result.employmentType, 'Full-time');
  assert.strictEqual(result.status, 'New');
});

test('processJob: should handle missing fields gracefully', () => {
  const rawJob = {};
  const result = processor.processJob(rawJob, 'Developer');

  assert.strictEqual(result.jobTitle, 'Developer');
  assert.strictEqual(result.companyName, 'Unknown');
  assert.strictEqual(result.companyLinkedInUrl, '');
  assert.strictEqual(result.jobPostingUrl, '');
});

test('processJob: should calculate days since posted', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const rawJob = {
    publishedAt: yesterday.toISOString()
  };

  const result = processor.processJob(rawJob, 'Test');
  assert.strictEqual(result.daysSincePosted, 1);
});

// ============================================
// cleanCompanyName tests
// ============================================

test('cleanCompanyName: should trim whitespace', () => {
  assert.strictEqual(processor.cleanCompanyName('  Acme Corp  '), 'Acme Corp');
});

test('cleanCompanyName: should normalize multiple spaces', () => {
  assert.strictEqual(processor.cleanCompanyName('Acme    Corp'), 'Acme Corp');
});

test('cleanCompanyName: should return Unknown for null', () => {
  assert.strictEqual(processor.cleanCompanyName(null), 'Unknown');
});

// ============================================
// truncateDescription tests
// ============================================

test('truncateDescription: should not truncate short descriptions', () => {
  const desc = 'Short description';
  assert.strictEqual(processor.truncateDescription(desc), desc);
});

test('truncateDescription: should truncate long descriptions', () => {
  const desc = 'A'.repeat(600);
  const result = processor.truncateDescription(desc, 500);
  assert.strictEqual(result.length, 503); // 500 + '...'
  assert.ok(result.endsWith('...'));
});

test('truncateDescription: should handle empty string', () => {
  assert.strictEqual(processor.truncateDescription(''), '');
});

// ============================================
// filterExcludedCompanies tests
// ============================================

test('filterExcludedCompanies: should filter matching companies', () => {
  const jobs = [
    { companyName: 'Salesforce Inc' },
    { companyName: 'Google' },
    { companyName: 'Salesforce.com' }
  ];

  const result = processor.filterExcludedCompanies(jobs, ['Salesforce']);
  assert.strictEqual(result.filtered.length, 1);
  assert.strictEqual(result.excluded, 2);
  assert.strictEqual(result.filtered[0].companyName, 'Google');
});

test('filterExcludedCompanies: should be case-insensitive', () => {
  const jobs = [
    { companyName: 'SALESFORCE' },
    { companyName: 'Google' }
  ];

  const result = processor.filterExcludedCompanies(jobs, ['salesforce']);
  assert.strictEqual(result.filtered.length, 1);
  assert.strictEqual(result.filtered[0].companyName, 'Google');
});

test('filterExcludedCompanies: should return all jobs if no exclusions', () => {
  const jobs = [{ companyName: 'Acme' }, { companyName: 'Beta' }];

  const result = processor.filterExcludedCompanies(jobs, []);
  assert.strictEqual(result.filtered.length, 2);
  assert.strictEqual(result.excluded, 0);
});

test('filterExcludedCompanies: should handle empty jobs array', () => {
  const result = processor.filterExcludedCompanies([], ['Salesforce']);
  assert.strictEqual(result.filtered.length, 0);
  assert.strictEqual(result.excluded, 0);
});

// ============================================
// deduplicateByCompany tests
// ============================================

test('deduplicateByCompany: should keep one job per company', () => {
  const jobs = [
    { companyName: 'Acme', postedDate: '2024-01-01' },
    { companyName: 'Acme', postedDate: '2024-01-02' },
    { companyName: 'Beta', postedDate: '2024-01-01' }
  ];

  const result = processor.deduplicateByCompany(jobs);
  assert.strictEqual(result.length, 2);
});

test('deduplicateByCompany: should keep most recent posting', () => {
  const jobs = [
    { companyName: 'Acme', postedDate: '2024-01-01', jobTitle: 'Old' },
    { companyName: 'Acme', postedDate: '2024-01-15', jobTitle: 'New' }
  ];

  const result = processor.deduplicateByCompany(jobs);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].jobTitle, 'New');
});

test('deduplicateByCompany: should be case-insensitive for company names', () => {
  const jobs = [
    { companyName: 'ACME', postedDate: '2024-01-01' },
    { companyName: 'acme', postedDate: '2024-01-02' }
  ];

  const result = processor.deduplicateByCompany(jobs);
  assert.strictEqual(result.length, 1);
});

test('deduplicateByCompany: should handle empty array', () => {
  const result = processor.deduplicateByCompany([]);
  assert.strictEqual(result.length, 0);
});

test('deduplicateByCompany: should prefer job with date over job without', () => {
  const jobs = [
    { companyName: 'Acme', postedDate: null, jobTitle: 'NoDate' },
    { companyName: 'Acme', postedDate: '2024-01-15', jobTitle: 'HasDate' }
  ];

  const result = processor.deduplicateByCompany(jobs);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].jobTitle, 'HasDate');
});

// ============================================
// getUniqueCompanies tests
// ============================================

test('getUniqueCompanies: should return unique company names', () => {
  const jobs = [
    { companyName: 'Acme' },
    { companyName: 'acme' },
    { companyName: 'Beta' }
  ];

  const result = processor.getUniqueCompanies(jobs);
  assert.strictEqual(result.size, 2);
  assert.ok(result.has('acme'));
  assert.ok(result.has('beta'));
});

// ============================================
// Summary
// ============================================

console.log('\n' + '='.repeat(40));
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40));

process.exit(failed > 0 ? 1 : 0);
