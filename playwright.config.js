/**
 * SiteVerdict Playwright Configuration
 *
 * Tests run against the live deployed site by default.
 * Override with:  BASE_URL=https://your-site.netlify.app npm run test:sitecheck
 *
 * Netlify CLI is NOT installed — local function serving is not available.
 * End-to-end tests require the site to be deployed to Netlify first.
 */

const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://siteverdict2.netlify.app';

module.exports = defineConfig({
  testDir:  './tests',
  timeout:  60000,           // 60s per test (Site Check can take up to 25s + page load)
  retries:  1,               // one retry on flaky network
  workers:  1,               // serial — avoid hammering the live geocode function
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL:           BASE_URL,
    headless:          true,
    viewport:          { width: 1280, height: 800 },
    actionTimeout:     30000,  // NSW check can take 9-11s locally (ftx() timeout)
    navigationTimeout: 30000,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
  },
  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});
