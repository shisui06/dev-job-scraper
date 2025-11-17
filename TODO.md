# TODO: Skip Database Connection for Development

## Tasks
- [ ] Modify `src/backend/config/db.js` to make DB connection optional (don't exit on failure)
- [ ] Update `src/backend/models/Job.js` to use in-memory storage when DB is unavailable
- [ ] Update `src/backend/index.js` to handle DB connection failure gracefully
- [ ] Update `src/backend/routes/jobs.js` to work with in-memory data
- [ ] Test backend startup without DB
- [ ] Verify frontend can fetch jobs (mock data or in-memory)

## Information Gathered
- DB is used for storing scraped jobs and retrieving them via API
- Scrapers save jobs using `saveJobs` function
- Frontend fetches jobs from `/api/jobs` endpoint
- Without DB, we can use an in-memory array to simulate storage

## Plan
1. Make DB connection non-blocking
2. Implement in-memory job storage as fallback
3. Ensure API routes work with both DB and memory
4. Test the application

## Followup Steps
- Run `npm run dev` to test backend
- Check if frontend loads at http://localhost:5174/
- Verify job scraping and fetching work without DB
