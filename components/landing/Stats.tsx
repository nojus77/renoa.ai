export default function Stats() {
  return (
    <section className="stats" id="stats">
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number" data-count="10000">0</div>
          <div className="stat-label">Projects Completed</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" data-count="500">0</div>
          <div className="stat-label">Verified Professionals</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" data-count="4.9">0</div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-item">
          <div className="stat-number-text">&lt;2 min</div>
          <div className="stat-label">Response Time</div>
        </div>
      </div>
    </section>
  );
}
