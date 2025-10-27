
import { IndeedScraper } from './base.js';
import { LinkedInScraper } from './linkedin.js';
import { GlassdoorScraper } from './glassdoor.js';
import { MonsterScraper } from './monster.js';

export const startScrapers = async () => {
  // Add more scrapers here as needed
  const scrapers = [
    new IndeedScraper(),
    new LinkedInScraper(),
    new GlassdoorScraper(),
    new MonsterScraper(),
  ];
  for (const scraper of scrapers) {
    await scraper.scrape();
  }
};
