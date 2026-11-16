import { Link } from 'react-router-dom';

const collections = [
  { category: 'Audio', label: 'Studio audio' },
  { category: 'Workstation', label: 'Workstations' },
  { category: 'Wearables', label: 'Wearables' },
];

export function StorefrontCampaign() {
  return (
    <>
      <section className="campaign" aria-labelledby="campaign-title">
        <div className="campaign-art">
          <img src="/demo/nova.jpg" alt="Black over-ear Nova headphones in a studio still life" width="1200" height="800" fetchPriority="high" />
        </div>
        <div className="campaign-copy">
          <p className="campaign-kicker">The audio edit</p>
          <h1 id="campaign-title">For the love<br />of <em>listening.</em></h1>
          <p className="campaign-intro">Explore the Nova headphone collection, from the standard pair to the pro bundle.</p>
          <div className="campaign-actions">
            <Link className="primary-button" to="/products?categories=Audio">Explore audio <span aria-hidden="true">→</span></Link>
            <Link className="text-action" to="/products">Browse all products</Link>
          </div>
        </div>
      </section>
      <nav className="collection-index" aria-label="Shop by category">
        <span>Shop by category</span>
        {collections.map(({ category, label }) => (
          <Link key={category} to={'/products?categories=' + encodeURIComponent(category)}>
            {label}<span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
