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
    this.browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'en-CA'
    });
    this.page = await this.context.newPage();

    // Add human-like behavior and anti-detection
    await this.page.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', description: '', filename: 'internal-nacl-plugin' }
        ],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-CA', 'en', 'fr-CA', 'fr'],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Mock hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4,
      });

      // Mock device memory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });

      // Override screen properties
      Object.defineProperty(screen, 'width', { get: () => 1280 });
      Object.defineProperty(screen, 'height', { get: () => 720 });
      Object.defineProperty(screen, 'availWidth', { get: () => 1280 });
      Object.defineProperty(screen, 'availHeight', { get: () => 680 });
      Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
      Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });

      // Mock timezone
      Object.defineProperty(Intl, 'DateTimeFormat', {
        value: class extends Intl.DateTimeFormat {
          resolvedOptions() {
            const options = super.resolvedOptions();
            options.timeZone = 'America/Toronto';
            return options;
          }
        }
      });

      // Override canvas fingerprinting
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type) {
        const context = getContext.apply(this, arguments);
        if (type === '2d') {
          const toDataURL = context.toDataURL;
          context.toDataURL = function() {
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
          };
        }
        return context;
      };

      // Mock WebGL
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel(R) Iris(TM) Graphics 6100';
        return getParameter.call(this, parameter);
      };

      // Override iframe contentWindow
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        get: function() {
          return window;
        }
      });

      // Mock battery
      if ('getBattery' in navigator) {
        navigator.getBattery = () => Promise.resolve({
          charging: true,
          chargingTime: Infinity,
          dischargingTime: Infinity,
          level: 1
        });
      }
    });
  }

  async close() {
    await this.context?.close();
    await this.browser?.close();
  }

  async scrape() {
    try {
      await this.init();
      await this.extractJobs();
      return [];
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
    super('https://ca.indeed.com');
  }

  async extractJobs() {
    // Scrape for junior, beginner, and internship web developer jobs, multiple pages
    const keywords = [
      'javascript+developer',
      'react+developer',
      'nextjs+developer',
      'junior+javascript+developer',
      'junior+react+developer',
      'junior+nextjs+developer',
      'entry+level+javascript+developer',
      'entry+level+react+developer',
      'entry+level+nextjs+developer'
    ];
    const locations = ['Montreal, Quebec'];
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
          await this.page.waitForSelector('[data-testid="jobsearch-SerpJobCard"], .job_seen_beacon', { timeout: 10000 });
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
            // Extract salary if available
            const salary = job.querySelector('.salary-snippet')?.textContent?.trim() || '';
            // Extract date posted
            const datePosted = job.querySelector('.date')?.textContent?.trim() || '';
            return {
              title: job.querySelector('.jobTitle')?.textContent?.trim() || job.querySelector('h2.jobTitle')?.textContent?.trim() || '',
              company: job.querySelector('.companyName')?.textContent?.trim() || '',
              location: job.querySelector('.companyLocation')?.textContent?.trim() || '',
              description: job.querySelector('.job-snippet')?.textContent?.trim() || '',
              link,
              source: 'Indeed',
              datePosted,
              salary,
            };
          })
        );
        jobs.push(...pageJobs);
        // Save jobs incrementally after each page
        await saveJobs(pageJobs);
      }
    }
    return jobs;
  }
}