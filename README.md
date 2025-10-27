# Dev Job Scraper

## MongoDB Atlas Setup (2025)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. Click **Create** or **Build a Database**.
3. Select the **Shared** (free) cluster option.
4. Choose your cloud provider and region, then click **Create**.
5. Wait for the cluster to deploy.
6. In the left menu, click **Deployment** → **Database** (or **Clusters** if shown).
7. Click **Connect** on your cluster.
8. Choose **Drivers** or **Connect your application**.
9. Copy the connection string (starts with `mongodb+srv://`).
10. In the left menu, go to **Security** → **Database Access** to add a user and password.
11. Go to **Security** → **Network Access** to add your IP address (or `0.0.0.0/0` for all).
12. Replace `<username>` and `<password>` in your connection string with your user credentials.
13. Paste this string in your `.env` file as `MONGODB_URI`.

Example `.env`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
PORT=3001
```

---


## Adding More Scrapers (Job Sites)

To scrape more job sites (e.g., LinkedIn, Glassdoor, Monster), follow these steps:

1. **Create a new scraper class** in `src/backend/scrapers/`, extending `BaseScraper`.
2. **Implement the `extractJobs` method** to scrape jobs from the target site. Use Playwright to navigate and extract job data.
3. **Add your scraper to `src/backend/scrapers/index.js`** so it runs with the others.

### Scraper Template

```
import { BaseScraper } from './base.js';

export class ExampleJobSiteScraper extends BaseScraper {
	constructor() {
		super('https://www.example.com');
	}

	async extractJobs() {
		await this.page.goto(`${this.url}/jobs?q=web+developer+internship`);
		// Use Playwright selectors to extract job data
		return await this.page.$$eval('.job-listing', (jobs) =>
			jobs.map((job) => ({
				title: job.querySelector('.job-title')?.textContent?.trim() || '',
				company: job.querySelector('.company')?.textContent?.trim() || '',
				location: job.querySelector('.location')?.textContent?.trim() || '',
				description: job.querySelector('.description')?.textContent?.trim() || '',
				link: job.querySelector('a')?.href || '',
				source: 'ExampleJobSite',
				datePosted: new Date().toISOString(),
			}))
		);
	}
}
```

### Register Your Scraper

In `src/backend/scrapers/index.js`:

```
import { ExampleJobSiteScraper } from './example.js';
// ...existing imports

export const startScrapers = async () => {
	const scrapers = [
		new IndeedScraper(),
		new ExampleJobSiteScraper(), // Add your new scraper here
	];
	for (const scraper of scrapers) {
		await scraper.scrape();
	}
};
```

**Tip:** Inspect the HTML of your target job site to find the correct selectors for job listings, titles, companies, etc.

For more help, see the official [MongoDB Atlas documentation](https://www.mongodb.com/docs/atlas/).
