// playwright.config.js — SiteVerdict release-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8099',
    headless: true,
  },
  webServer: {
    command: 'npx http-server public -p 8099 -c-1 --silent',
    url: 'http://localhost:8099/version.json',
    timeout: 30000,
    reuseExistingServer: true,
  },
});
