// apps/web/src/components/home/HeroBento.tsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { HERO_REVEAL, EDITORIAL_EASE } from "../../lib/motion";

interface HeroBentoProps {
  onOpenPalette: () => void;
}

export function HeroBento({ onOpenPalette }: HeroBentoProps) {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const bgTextX = useTransform(scrollYProgress, [0, 1], ["0%", "-16%"]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <>
      <section ref={heroRef} className="editorial-hero">
        <div className="container-editorial editorial-hero__inner">
          <div className="editorial-hero__meta font-mono-tabular">
            <span>SHOPPILOT // EDITION 04</span>
            <span>AI-INDEXED CATALOG</span>
          </div>

          <motion.div
            style={reduced ? undefined : { x: bgTextX }}
            aria-hidden="true"
            className="editorial-hero__backdrop"
          >
            STUDIO OBJECTS
          </motion.div>

          <div className="editorial-hero__grid">
            <div className="editorial-hero__copy">
              <motion.h1
                custom={0}
                variants={HERO_REVEAL}
                initial="hidden"
                animate="visible"
                className="editorial-hero__title"
              >
                Objects built for daily ritual.
              </motion.h1>

              <motion.p
                custom={0.08}
                variants={HERO_REVEAL}
                initial="hidden"
                animate="visible"
                className="editorial-hero__lead"
              >
                Precision hardware, modular workspace essentials, and instant SKU
                matching powered by ShopPilot AI.
              </motion.p>

              <motion.div
                custom={0.16}
                variants={HERO_REVEAL}
                initial="hidden"
                animate="visible"
                className="editorial-hero__actions"
              >
                <Link to="/products" className="btn-primary">
                  <span>Explore Catalog</span>
                  <ArrowUpRight size={16} />
                </Link>
                <button type="button" onClick={onOpenPalette} className="btn-ghost">
                  <Sparkles size={15} />
                  <span>Ask AI (⌘K)</span>
                </button>
              </motion.div>
            </div>

            <div className="editorial-hero__frame">
              <motion.img
                style={reduced ? undefined : { scale: mediaScale, y: mediaY }}
                src="/demo/nova.jpg" fetchPriority="high"
                alt="Nova over-ear headphones"
                className="editorial-hero__img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric Bento Feature Section */}
      <section className="container-editorial bento-section">
        <div className="bento-grid">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EDITORIAL_EASE }}
            className="bento-card bento-card--wide"
          >
            <span className="bento-card__eyebrow font-mono-tabular">01 // CURATED DROPS</span>
            <h2 className="bento-card__title">Acoustic &amp; Desk Architecture</h2>
            <p className="bento-card__desc">
              Explore available finishes and configurations for your workspace.
            </p>
            <Link to="/products" className="bento-card__link">
              Shop Featured <ArrowUpRight size={15} />
            </Link>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.08, ease: EDITORIAL_EASE }}
            className="bento-card bento-card--dark"
          >
            <span className="bento-card__eyebrow font-mono-tabular">02 // SHOPPILOT AI</span>
            <h2 className="bento-card__title">Natural-Language SKU Search</h2>
            <p className="bento-card__desc">
              Press ⌘K anywhere to compare specs, filter by budget, or locate in-stock variants.
            </p>
            <button type="button" onClick={onOpenPalette} className="bento-card__link">
              Launch Palette <ArrowUpRight size={15} />
            </button>
          </motion.article>
        </div>
      </section>
    </>
  );
}

