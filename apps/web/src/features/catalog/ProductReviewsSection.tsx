import { useId, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { STAGGER, TRANSITION, VIEWPORT_ONCE } from '../../lib/motion';
import { fetchProductReviews, submitProductReview, type ReviewItem } from './reviewsApi';

const STARS = [5, 4, 3, 2, 1] as const;

function Stars({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="stars" role="img" aria-label={`Rated ${rounded} out of 5`}>
      <span aria-hidden="true">{'★'.repeat(rounded)}<span className="stars__empty">{'★'.repeat(5 - rounded)}</span></span>
    </span>
  );
}

/** Counts of the loaded reviews by star rating. Only real reviews are counted. */
function distribution(reviews: ReviewItem[]) {
  return STARS.map(stars => ({ stars, count: reviews.filter(review => Math.round(review.rating) === stars).length }));
}

export function ProductReviewsSection({ productId }: { productId: number }) {
  const client = useQueryClient();
  const ids = { rating: useId(), title: useId(), comment: useId() };
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const reviews = useQuery({ queryKey: ['reviews', productId], queryFn: () => fetchProductReviews(productId) });
  const publish = useMutation({
    mutationFn: () => submitProductReview(productId, { rating, title, comment }),
    onSuccess: async () => {
      setTitle(''); setComment(''); setShowForm(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['reviews', productId] }),
        client.invalidateQueries({ queryKey: ['product', String(productId)] }),
      ]);
    },
  });

  const submit = (event: FormEvent) => { event.preventDefault(); publish.mutate(); };

  if (reviews.isPending) {
    return (
      <section className="reviews" aria-labelledby="reviews-title">
        <h2 id="reviews-title">Customer reviews</h2>
        <div role="status" aria-label="Loading reviews" className="reviews__loading">
          <div className="skeleton reviews__skeleton-summary" />
          <div className="skeleton reviews__skeleton-card" /><div className="skeleton reviews__skeleton-card" />
        </div>
      </section>
    );
  }

  if (reviews.isError) {
    return (
      <section className="reviews" aria-labelledby="reviews-title">
        <h2 id="reviews-title">Customer reviews</h2>
        <div className="state-panel error-state" role="alert">
          <strong>Couldn’t load reviews.</strong>
          <span>{reviews.error.message}</span>
          <button type="button" onClick={() => reviews.refetch()}>Retry</button>
        </div>
      </section>
    );
  }

  const { digest, reviews: items, can_review } = reviews.data;
  const bars = distribution(items);
  const peak = Math.max(1, ...bars.map(bar => bar.count));

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <header className="reviews__head">
        <h2 id="reviews-title">Customer reviews <span className="tnum reviews__total">({digest.total_reviews})</span></h2>
        {can_review ? (
          <button type="button" className="btn-ghost" aria-expanded={showForm} onClick={() => setShowForm(open => !open)}>
            {showForm ? 'Cancel' : 'Write a review'}
          </button>
        ) : (
          <p className="reviews__note">Only customers who bought this product can review it.</p>
        )}
      </header>

      <div className="reviews__summary">
        {digest.total_reviews > 0 && (
          <div className="reviews__score">
            <p className="reviews__average tnum">{digest.average_rating.toFixed(1)}<span> / 5</span></p>
            <Stars value={digest.average_rating} />
            <p className="reviews__verified tnum">{digest.verified_count} verified {digest.verified_count === 1 ? 'purchase' : 'purchases'}</p>
          </div>
        )}
        <div className="reviews__digest">
          {digest.sentiment_label && <p className="reviews__label">{digest.sentiment_label}</p>}
          {digest.summary && <p>{digest.summary}</p>}
          {(digest.pros.length > 0 || digest.cons.length > 0) && (
            <div className="reviews__themes">
              {digest.pros.length > 0 && <div><h3>What customers like</h3><ul>{digest.pros.map((pro, i) => <li key={`${i}:${pro}`}>{pro}</li>)}</ul></div>}
              {digest.cons.length > 0 && <div><h3>Worth knowing</h3><ul>{digest.cons.map((con, i) => <li key={`${i}:${con}`}>{con}</li>)}</ul></div>}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <ul className="reviews__bars" aria-label="Rating breakdown">
            {bars.map(({ stars, count }, index) => (
              <li key={stars}>
                <span className="tnum">{stars} star{stars > 1 ? 's' : ''}</span>
                <span className="reviews__track" aria-hidden="true">
                  <motion.span className="reviews__fill" initial={{ scaleX: 0 }} whileInView={{ scaleX: count / peak }} viewport={VIEWPORT_ONCE}
                    transition={{ ...TRANSITION.reveal, delay: index * STAGGER }} />
                </span>
                <span className="tnum reviews__count">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && can_review && (
        <form className="reviews__form" onSubmit={submit}>
          <label htmlFor={ids.rating}>Rating
            <select id={ids.rating} value={rating} onChange={event => setRating(Number(event.target.value))}>
              {STARS.map(value => <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>)}
            </select>
          </label>
          <label htmlFor={ids.title}>Headline
            <input id={ids.title} required minLength={3} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} />
          </label>
          <label htmlFor={ids.comment}>Your review
            <textarea id={ids.comment} required minLength={10} maxLength={2000} rows={4} value={comment} onChange={event => setComment(event.target.value)} />
          </label>
          {publish.isError && <p className="form-error" role="alert">{publish.error.message}</p>}
          <button type="submit" className="btn-primary" disabled={publish.isPending}>{publish.isPending ? 'Publishing…' : 'Publish review'}</button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="reviews__empty">
          No reviews yet.{can_review ? ' Be the first to share how it performs.' : ' Reviews open once customers have bought it.'}
        </p>
      ) : (
        <ul className="reviews__list">
          {items.map(review => (
            <li key={review.id} className="review-card">
              <div className="review-card__top">
                <Stars value={review.rating} />
                {review.is_verified_purchase && <span className="review-card__verified"><Check size={13} aria-hidden="true" /> Verified purchase</span>}
              </div>
              <h3>{review.title}</h3>
              <p>{review.comment}</p>
              <p className="review-card__by">{review.author_name} · <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('en-IN')}</time></p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
