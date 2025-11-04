
import { useEffect, useState } from 'react';
import './App.css';


function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');

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

  return (
    <div className="App">
      <h1>Web Dev Junior & Internship Jobs</h1>
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
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {jobs.map((job) => (
          <li key={job._id} style={{ border: '1px solid #ccc', margin: '1em 0', padding: '1em', borderRadius: '8px' }}>
            <h2 style={{ margin: 0 }}>{job.title}</h2>
            <p style={{ margin: '0.5em 0' }}><strong>{job.company}</strong> — {job.location}</p>
            <p>{job.description}</p>
            <a href={job.link} target="_blank" rel="noopener noreferrer">View Job</a>
            <div style={{ fontSize: '0.8em', color: '#888', marginTop: '0.5em' }}>Source: {job.source} | Posted: {job.datePosted?.slice(0, 10)}</div>
          </li>
        ))}
      </ul>
      {!loading && jobs.length === 0 && <p>No jobs found.</p>}
    </div>
  );
}

export default App;
