import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Search } from 'lucide-react';
import { Magnetic } from '../motion/Magnetic';
import { TRANSITION, STAGGER, useScrollProgress, useScrollRange } from '../../lib/motion';

const TITLE_LINES = ['Hardware for', 'focused work.'];

const COLLECTIONS = [
  { category: 'Audio', label: 'Studio audio' },
  { category: 'Workstation', label: 'Workstations' },
  { category: 'Wearables', label: 'Wearables' },
];

const shortcut = () =>
  typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K';

/**
 * Home hero. Sits inside the page's dark band. The photograph drifts and settles
 * against the scroll; the copy lifts away a little faster, which is the only parallax.
 */
export function HeroBento({ onOpenPalette }: { onOpenPalette: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref, ['start start', 'end start']);
  const imageY = useScrollRange(progress, '-8%', '8%');
  const imageScale = useScrollRange(progress, 1.02, 1.1);
  const copyY = useScrollRange(progress, 0, -56);

  return (
    <section ref={ref} className="hero band" aria-labelledby="hero-title">
      <div className="container-editorial hero__grid">
        <motion.div className="hero__copy" style={{ y: copyY }}>
          <h1 id="hero-title" className="hero__title">
            {TITLE_LINES.map((line, index) => (
              <span className="hero__line" key={line}>
                <motion.span className="hero__line-inner" initial={{ y: '105%' }} animate={{ y: 0 }}
                  transition={{ ...TRANSITION.reveal, delay: 0.05 + index * STAGGER * 1.4 }}>
                  {line}{index === 0 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p className="hero__lead" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION.enter, delay: 0.22 }}>
            Studio audio, workstation gear and wearables. Search in plain language, or ask the
            assistant to compare options and add them to your cart.
          </motion.p>
          <motion.div className="hero__actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION.enter, delay: 0.3 }}>
            <Magnetic>
              <Link to="/products" className="btn-primary">Shop the collection <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </Magnetic>
            <button type="button" className="btn-ghost" onClick={onOpenPalette}>
              <Search size={15} aria-hidden="true" /> Ask the assistant <kbd className="hero__kbd">{shortcut()}</kbd>
            </button>
          </motion.div>
        </motion.div>

        <div className="hero__media">
          <motion.img className="hero__img" src="/demo/nova-detail-1.jpg" width={800} height={1000}
            alt="Close detail of the Nova headphones" loading="eager" fetchPriority="high" decoding="async"
            style={{ y: imageY, scale: imageScale }} />
        </div>
      </div>

      <nav className="container-editorial hero__index" aria-label="Shop by category">
        {COLLECTIONS.map(({ category, label }) => (
          <Link key={category} to={'/products?categories=' + encodeURIComponent(category)}>
            <span>{label}</span><ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
