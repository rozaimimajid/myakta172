module.exports = {
  testDir: './tests',
  testMatch: ['audit-final.spec.cjs','audit-extended.spec.cjs'],
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8000',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  reporter: [['line'],['html',{open:'never'}]]
};
