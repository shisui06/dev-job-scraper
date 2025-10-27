import { chromium } from 'playwright';
import { saveJobs } from '../models/Job.js';

// Base scraper class that other scrapers will extend
export class BaseScraper {
  constructor(url) {
    this.url = url;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
  this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    this.page = await this.context.newPage();
  }

  async close() {
    await this.context?.close();
    await this.browser?.close();
  }

  async scrape() {
    try {
      await this.init();
      const jobs = await this.extractJobs();
      await saveJobs(jobs);
      return jobs;
    } catch (error) {
      console.error(`Error scraping ${this.url}:`, error);
      return [];
    } finally {
      await this.close();
    }
  }

  // This method should be implemented by each specific scraper
  async extractJobs() {
    throw new Error('extractJobs method must be implemented');
  }
}

export class IndeedScraper extends BaseScraper {
  constructor() {
    super('https://www.indeed.com');
  }

  async extractJobs() {
    // Scrape for both web developer internships and junior web developer jobs, multiple pages
    const keywords = [
      'web+developer+internship',
      'junior+web+developer',
      'entry+level+web+developer',
      'front+end+developer+internship',
      'junior+front+end+developer',
      'entry+level+front+end+developer',
      'back+end+developer+internship',
      'junior+back+end+developer',
      'software+developer+internship',
      'junior+software+developer',
      'entry+level+software+developer',
      'full+stack+developer+internship',
      'junior+full+stack+developer'
    ];
  const locations = ['Montreal'];
    const searchCombos = [];
    for (const keyword of keywords) {
      for (const location of locations) {
        searchCombos.push({ keyword, location });
      }
    }
    const jobs = [];
    for (const combo of searchCombos) {
      for (let start = 0; start < 50; start += 10) { // Scrape first 5 pages (10 jobs per page)
        const url = `${this.url}/jobs?q=${combo.keyword}&l=${encodeURIComponent(combo.location)}&start=${start}`;
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
        // Wait for job cards to load
        try {
          await this.page.waitForSelector('[data-testid="jobsearch-SerpJobCard"], .job_seen_beacon', { timeout: 8000 });
        } catch (e) {
          // No jobs found on this page
          continue;
        }
        const pageJobs = await this.page.$$eval('.job_seen_beacon, [data-testid="jobsearch-SerpJobCard"]', (jobEls) =>
          jobEls.map((job) => {
            // Try to get the job link robustly
            let link = '';
            const titleAnchor = job.querySelector('a[data-jk], a.jcs-JobTitle');
            if (titleAnchor) {
              link = titleAnchor.href || '';
            }
            return {
              title: job.querySelector('.jobTitle')?.textContent?.trim() || job.querySelector('h2.jobTitle')?.textContent?.trim() || '',
              company: job.querySelector('.companyName')?.textContent?.trim() || '',
              location: job.querySelector('.companyLocation')?.textContent?.trim() || '',
              description: job.querySelector('.job-snippet')?.textContent?.trim() || '',
              link,
              source: 'Indeed',
              datePosted: new Date().toISOString(),
            };
          })
        );
        jobs.push(...pageJobs);
      }
    }
    return jobs;
  }
}