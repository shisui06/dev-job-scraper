import { BaseScraper } from './base.js';

export class GlassdoorScraper extends BaseScraper {
  constructor() {
    super('https://www.glassdoor.com');
  }

  async extractJobs() {
    // TODO: Implement Glassdoor scraping logic
    // For now, return an empty array
    return [];
  }
}
