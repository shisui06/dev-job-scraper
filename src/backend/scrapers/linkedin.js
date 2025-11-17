import { BaseScraper } from './base.js';

export class LinkedInScraper extends BaseScraper {
  constructor() {
    super('https://www.linkedin.ca');
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
        const url = `${this.url}/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_TPR=r86400&sortBy=DD`;
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Add random delay to mimic human behavior
        await this.page.waitForTimeout(Math.random() * 3000 + 2000);

        // Scroll down to load more content
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await this.page.waitForTimeout(Math.random() * 1000 + 500);

        // Wait for job cards to load
        try {
          await this.page.waitForSelector('[data-job-id]', { timeout: 15000 });
        } catch (e) {
          // No jobs found on this page
          continue;
        }
        const pageJobs = await this.page.$$eval('[data-job-id]', (jobEls) =>
          jobEls.slice(0, 10).map((job) => {
            const title = job.querySelector('h3')?.textContent?.trim() || '';
            const company = job.querySelector('[data-test-id="company-name"]')?.textContent?.trim() || '';
            const location = job.querySelector('[data-test-id="job-location"]')?.textContent?.trim() || '';
            const description = job.querySelector('[data-test-id="job-description"]')?.textContent?.trim() || '';
            const link = job.querySelector('a')?.href || '';
            const salary = job.querySelector('[data-test-id="salary"]')?.textContent?.trim() || '';
            const datePosted = job.querySelector('time')?.textContent?.trim() || '';
            return {
              title,
              company,
              location,
              description,
              link,
              source: 'LinkedIn',
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
