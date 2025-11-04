export default function Testimonials() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">What homeowners are saying</h2>
          <p className="section-subtitle">Real experiences from people who trust Renoa for their home projects.</p>
        </div>

        <div className="testimonial-grid">
          <div className="testimonial">
            <div className="quote-mark">&quot;</div>
            <p className="testimonial-text">After years of dealing with unreliable contractors, finding Renoa was a breath of fresh air. They matched me with a fantastic landscaper who transformed my backyard. Professional, punctual, and reasonably priced.</p>
            <div className="testimonial-author">
              <div className="author-avatar">SJ</div>
              <div className="author-info">
                <h4>Sarah Johnson</h4>
                <p>Homeowner • Chicago, IL</p>
              </div>
            </div>
            <div className="stars">★★★★★</div>
          </div>

          <div className="testimonial">
            <div className="quote-mark">&quot;</div>
            <p className="testimonial-text">As someone who values quality and reliability, Renoa exceeded my expectations. The platform made it easy to find verified professionals, and the service provider they matched me with was exceptional.</p>
            <div className="testimonial-author">
              <div className="author-avatar">RT</div>
              <div className="author-info">
                <h4>Robert Thompson</h4>
                <p>Homeowner • Seattle, WA</p>
              </div>
            </div>
            <div className="stars">★★★★★</div>
          </div>
        </div>
      </div>
    </section>
  );
}
