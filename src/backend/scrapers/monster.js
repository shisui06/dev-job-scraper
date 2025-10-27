import { BaseScraper } from './base.js';

export class MonsterScraper extends BaseScraper {
  constructor() {
    super('https://www.monster.com');
  }

  async extractJobs() {
    // TODO: Implement Monster scraping logic
    // For now, return an empty array
    return [];
  }
}
