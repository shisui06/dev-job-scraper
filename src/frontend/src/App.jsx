
import { useEffect, useState } from 'react';
import './App.css';


function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [clickedJobs, setClickedJobs] = useState(new Set());

  const fetchJobs = async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = search ? `http://localhost:3001/api/jobs?keyword=${encodeURIComponent(search)}` : 'http://localhost:3001/api/jobs';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(keyword);
  };

  // Scrape jobs handler
  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/jobs/scrape', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start scraping');
      // Start polling for jobs
      const pollInterval = setInterval(async () => {
        await fetchJobs(keyword);
      }, 2000); // Poll every 2 seconds
      // Stop polling after 5 minutes (adjust as needed)
      setTimeout(() => {
        clearInterval(pollInterval);
        setLoading(false);
      }, 300000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJobClick = (jobId, jobLink) => {
    setClickedJobs(prev => new Set(prev).add(jobId));
    window.open(jobLink, '_blank');
  };

  return (
    <div className="App">
      <h1>Web Dev Junior & Internship Jobs</h1>
      <p>Total Jobs Found: {jobs.length}</p>
      <button onClick={handleScrape} style={{ padding: '0.5em 1em', marginBottom: '1em' }} disabled={loading}>
        {loading ? 'Scraping...' : 'Scrape Jobs'}
      </button>
      <form onSubmit={handleSearch} style={{ marginBottom: '1em' }}>
        <input
          type="text"
          placeholder="Search jobs (e.g. internship, React, frontend)"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ padding: '0.5em', width: '250px', marginRight: '0.5em' }}
        />
        <button type="submit" style={{ padding: '0.5em 1em' }}>Search</button>
      </form>
      {loading && <p>Loading jobs...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', padding: 0 }}>
        {jobs.map((job) => {
          const isClicked = clickedJobs.has(job._id);
          return (
            <div
              key={job._id}
              onClick={() => handleJobClick(job._id, job.link)}
              style={{
                border: '1px solid #ccc',
                padding: '1em',
                borderRadius: '8px',
                width: '300px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                backgroundColor: isClicked ? '#f0f8ff' : '#fff',
                opacity: isClicked ? 0.7 : 1
              }}
            >
              <h3 style={{ margin: '0 0 0.5em 0', fontSize: '1.1em' }}>{job.title}</h3>
              <p style={{ margin: '0.5em 0', fontWeight: 'bold' }}>{job.company} — {job.location}</p>
              {job.salary && <p style={{ margin: '0.5em 0', color: '#28a745' }}>Salary: {job.salary}</p>}
              <p style={{ margin: '0.5em 0', fontSize: '0.9em' }}>{job.description.length > 100 ? `${job.description.slice(0, 100)}...` : job.description}</p>
              <div style={{ fontSize: '0.8em', color: '#888', marginTop: '0.5em' }}>Source: {job.source} | Posted: {job.datePosted}</div>
            </div>
          );
        })}
      </div>
      {!loading && jobs.length === 0 && <p>No jobs found.</p>}
    </div>
  );
}

export default App;
