import { BaseScraper } from './base.js';

export class GlassdoorScraper extends BaseScraper {
  constructor() {
    super('https://www.glassdoor.ca');
  }

  async extractJobs() {
    // Scrape for junior, beginner, and internship web developer jobs
    const keywords = [
      'javascript developer',
      'react developer',
      'nextjs developer',
      'junior javascript developer',
      'junior react developer',
      'junior nextjs developer',
      'entry level javascript developer',
      'entry level react developer',
      'entry level nextjs developer'
    ];
    const locations = ['Montreal, Quebec'];
    const jobs = [];
    for (const keyword of keywords) {
      for (const location of locations) {
        const url = `${this.url}/Job/montreal-${keyword.replace(/\s+/g, '-')}-jobs-SRCH_IL.0,8_IC2281748_KO9,${keyword.replace(/\s+/g, '').length + 9}.htm`;
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Add random delay to mimic human behavior
        await this.page.waitForTimeout(Math.random() * 2500 + 1500);

        // Scroll down to load more content
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await this.page.waitForTimeout(Math.random() * 1000 + 500);

        // Wait for job cards to load
        try {
          await this.page.waitForSelector('[data-test="job-card"]', { timeout: 12000 });
        } catch (e) {
          // No jobs found on this page
          continue;
        }
        const pageJobs = await this.page.$$eval('[data-test="job-card"]', (jobEls) =>
          jobEls.map((job) => {
            const title = job.querySelector('[data-test="job-title"]')?.textContent?.trim() || '';
            const company = job.querySelector('[data-test="employer-name"]')?.textContent?.trim() || '';
            const location = job.querySelector('[data-test="job-location"]')?.textContent?.trim() || '';
            const description = job.querySelector('[data-test="job-description-text"]')?.textContent?.trim() || '';
            const link = job.querySelector('a')?.href || '';
            const salary = job.querySelector('[data-test="salary-estimate"]')?.textContent?.trim() || '';
            const datePosted = job.querySelector('[data-test="job-age"]')?.textContent?.trim() || '';
            return {
              title,
              company,
              location,
              description,
              link,
              source: 'Glassdoor',
              datePosted,
              salary,
            };
          })
        );
        jobs.push(...pageJobs);
        // Save jobs incrementally
        await saveJobs(pageJobs);
      }
    }
    return jobs;
  }
}
