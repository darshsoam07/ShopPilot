import React, { useEffect, useState } from "react";
import {
  fetchProductReviews,
  ProductReviewsBundle,
  submitProductReview,
} from "./reviewsApi";

interface ProductReviewsSectionProps {
  productId: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
}) => {
  const [bundle, setBundle] = useState<ProductReviewsBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadReviews = () => {
    setLoading(true);
    fetchProductReviews(productId)
      .then(setBundle)
      .catch((err: Error) => setFormError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await submitProductReview(productId, { rating, title, comment });
      setTitle("");
      setComment("");
      setShowForm(false);
      loadReviews();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message :
          "Unable to submit review. Verified purchase required."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !bundle && formError) return <p role="alert">{formError}</p>;
  if (loading || !bundle) {
    return (
      <section style={{ marginTop: "48px" }}>
        <p style={{ color: "var(--text-secondary, #6E6D68)", fontSize: "14px" }}>
          Loading verified buyer reviews...
        </p>
      </section>
    );
  }

  const { digest, reviews, can_review } = bundle;

  return (
    <section style={{ marginTop: "56px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "22px", margin: 0 }}>
          Verified Customer Reviews ({digest.total_reviews})
        </h2>

        {can_review ? (
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            style={{
              padding: "9px 18px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "var(--cta-bg, #141413)",
              color: "var(--cta-text, #F9F8F6)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showForm ? "Cancel" : "✎ Write a Verified Review"}
          </button>
        ) : (
          <span
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "999px",
              backgroundColor: "var(--bg-ai-panel, #F2F0EC)",
              color: "var(--text-secondary, #6E6D68)",
              border: "1px solid var(--border-hairline, #E5E3DD)",
            }}
          >
            ✓ Reviews restricted to verified SKU purchasers
          </span>
        )}
      </div>

      {/* AI Sentiment Digest Card */}
      <div
        style={{
          padding: "22px 24px",
          borderRadius: "16px",
          backgroundColor: "var(--bg-ai-panel, #F2F0EC)",
          border: "1px solid var(--border-hairline, #E5E3DD)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--accent-ai, #E85D34)", fontWeight: 700 }}>
              ✦ AI Sentiment Digest
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "999px",
                backgroundColor: "var(--bg-elevated, #FFFFFF)",
                border: "1px solid var(--border-hairline, #E5E3DD)",
              }}
            >
              {digest.sentiment_label}
            </span>
          </div>

          {digest.total_reviews > 0 && (
            <div style={{ fontSize: "15px", fontWeight: 700 }}>
              <span style={{ color: "#F59E0B" }}>★ {digest.average_rating.toFixed(1)}</span>{" "}
              <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-secondary)" }}>
                ({digest.verified_count} verified purchases)
              </span>
            </div>
          )}
        </div>

        <p
          style={{
            margin: "0 0 14px 0",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--text-primary, #141413)",
          }}
        >
          {digest.summary}
        </p>

        {/* Pros & Cons Theme Chips */}
        {(digest.pros.length > 0 || digest.cons.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {digest.pros.map((pro) => (
              <span
                key={pro}
                style={{
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  backgroundColor: "var(--bg-elevated, #FFFFFF)",
                  border: "1px solid var(--border-hairline, #E5E3DD)",
                  color: "#15803D",
                  fontWeight: 500,
                }}
              >
                + {pro}
              </span>
            ))}
            {digest.cons.map((con) => (
              <span
                key={con}
                style={{
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  backgroundColor: "var(--bg-elevated, #FFFFFF)",
                  border: "1px solid var(--border-hairline, #E5E3DD)",
                  color: "var(--text-secondary, #6E6D68)",
                }}
              >
                • Note: {con}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Verified Review Submission Form */}
      {showForm && can_review && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "22px",
            borderRadius: "14px",
            backgroundColor: "var(--bg-elevated, #FFFFFF)",
            border: "1px solid var(--border-hairline, #E5E3DD)",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Rating:</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-hairline, #E5E3DD)",
              }}
            >
              {[5, 4, 3, 2, 1].map((val) => (
                <option key={val} value={val}>
                  {val} Star{val > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <input
            required
            minLength={3}
            maxLength={120}
            placeholder="Review headline (e.g., Exceptional ANC and battery life)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-hairline, #E5E3DD)",
              fontSize: "14px",
            }}
          />

          <textarea
            required
            minLength={10}
            maxLength={2000}
            rows={3}
            placeholder="Share how this configuration performs in daily use..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-hairline, #E5E3DD)",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />

          {formError && (
            <div style={{ fontSize: "12px", color: "#B91C1C" }}>{formError}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              alignSelf: "flex-start",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--cta-bg, #141413)",
              color: "var(--cta-text, #F9F8F6)",
              fontWeight: 600,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Publishing..." : "Publish Verified Review"}
          </button>
        </form>
      )}

      {/* Individual Reviews List */}
      {reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {reviews.map((rev) => (
            <article
              key={rev.id}
              style={{
                padding: "18px 20px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-elevated, #FFFFFF)",
                border: "1px solid var(--border-hairline, #E5E3DD)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: "13px" }}>
                    {"★".repeat(rev.rating)}
                    {"☆".repeat(5 - rev.rating)}
                  </span>
                  <strong style={{ fontSize: "14px" }}>{rev.title}</strong>
                </div>

                {rev.is_verified_purchase && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#15803D",
                      backgroundColor: "var(--bg-canvas, #F9F8F6)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-hairline, #E5E3DD)",
                    }}
                  >
                    ✓ Verified Purchase
                  </span>
                )}
              </div>

              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "13px",
                  lineHeight: 1.55,
                  color: "var(--text-primary, #141413)",
                }}
              >
                {rev.comment}
              </p>

              <div style={{ fontSize: "11px", color: "var(--text-secondary, #6E6D68)" }}>
                By {rev.author_name} •{" "}
                {new Date(rev.created_at).toLocaleDateString()}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
