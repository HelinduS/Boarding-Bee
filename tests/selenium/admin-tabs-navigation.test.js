const { Builder, By, until } = require('selenium-webdriver');
const { getChromeOptions } = require('./seleniumTestUtils');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const assert = require('assert');

describe('Admin dashboard tab navigation', function() {
  this.timeout(40000);

  it('admin can visit all dashboard tabs', async function() {
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(getChromeOptions('admin-tabs')).build();
    try {
      // Assume already logged in as admin and start from dashboard
      await driver.get(`${BASE_URL}/admin-dashboard`);

      // Moderation tab
      const moderationTab = await driver.findElement(By.css('button[data-value="moderation"]'));
      await moderationTab.click();
      console.log('Clicked Moderation tab');
      await driver.sleep(700);
      await driver.wait(async () => {
        const cls = await moderationTab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Moderation tab did not become active');

      // Activity Log tab
      const activityTab = await driver.findElement(By.css('button[data-value="activity"]'));
      await activityTab.click();
      console.log('Clicked Activity Log tab');
      await driver.sleep(700);
      await driver.wait(async () => {
        const cls = await activityTab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Activity Log tab did not become active');

      // Security tab
      const securityTab = await driver.findElement(By.css('button[data-value="security"]'));
      await securityTab.click();
      console.log('Clicked Security tab');
      await driver.sleep(700);
      await driver.wait(async () => {
        const cls = await securityTab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Security tab did not become active');

      // Reports tab
      const reportsTab = await driver.findElement(By.css('button[data-value="reports"]'));
      await reportsTab.click();
      console.log('Clicked Reports tab');
      await driver.sleep(700);
      await driver.wait(async () => {
        const cls = await reportsTab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Reports tab did not become active');
    } finally {
      try { if (driver) await driver.quit(); } catch (e) { /* ignore */ }
    }
  });
});
