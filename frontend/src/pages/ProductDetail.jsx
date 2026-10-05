import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import Stars from "../components/Stars";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    () =>
      api(`/products/${id}`)
        .then(setProduct)
        .catch((e) => setError(e.message)),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleAdd = async () => {
    if (!user) return navigate("/login");
    try {
      await addToCart(product._id, qty);
      flash("Added to cart ✓");
    } catch (err) {
      flash(err.message);
    }
  };

  const handleWishlist = async () => {
    if (!user) return navigate("/login");
    try {
      await api(`/wishlist/${product._id}`, { method: "POST" });
      flash("Saved to wishlist ♥");
    } catch (err) {
      flash(err.message);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    setSubmitting(true);
    try {
      await api(`/products/${id}/review`, {
        method: "POST",
        body: { rating: Number(review.rating), comment: review.comment },
      });
      setReview({ rating: 5, comment: "" });
      await load();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <p className="text-slate-500">Loading…</p>;

  const outOfStock = product.stock === 0;
  const reviews = [...(product.reviews || [])].reverse();

  return (
    <div>
      <Link to="/" className="text-sm text-slate-500 hover:text-brand-600">
        ← Back to products
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="card overflow-hidden">
          {product.image?.url ? (
            <img
              src={product.image.url}
              alt={product.name}
              className="h-full max-h-120 w-full object-cover"
            />
          ) : (
            <div className="flex h-80 items-center justify-center bg-slate-100 text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="space-y-4">
          {product.category?.name && (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              {product.category.name}
            </span>
          )}
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Stars value={product.averageRating} />
            <span>
              {product.numReviews} review{product.numReviews === 1 ? "" : "s"}
            </span>
          </div>

          <p className="text-3xl font-bold text-brand-600">
            {formatPrice(product.price)}
          </p>
          <p className="text-slate-600">{product.description}</p>

          <p
            className={`text-sm font-medium ${outOfStock ? "text-red-600" : "text-emerald-600"}`}
          >
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </p>

          {!outOfStock && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.max(
                      1,
                      Math.min(product.stock, Number(e.target.value) || 1),
                    ),
                  )
                }
                className="input w-20"
              />
              <button onClick={handleAdd} className="btn-primary">
                Add to cart
              </button>
              <button onClick={handleWishlist} className="btn-outline">
                ♡ Wishlist
              </button>
            </div>
          )}

          {message && (
            <p className="text-sm font-medium text-brand-600">{message}</p>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Reviews</h2>

        {user ? (
          <form onSubmit={submitReview} className="card mb-6 space-y-3 p-4">
            <h3 className="font-semibold">Write a review</h3>
            {reviewError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {reviewError}
              </p>
            )}
            <select
              className="input w-auto"
              value={review.rating}
              onChange={(e) => setReview({ ...review, rating: e.target.value })}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <textarea
              className="input"
              rows={3}
              placeholder="Share your thoughts (3–500 characters)"
              value={review.comment}
              onChange={(e) =>
                setReview({ ...review, comment: e.target.value })
              }
              required
              minLength={3}
              maxLength={500}
            />
            <button className="btn-primary" disabled={submitting}>
              {submitting ? "Posting…" : "Post review"}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-sm text-slate-500">
            <Link to="/login" className="text-brand-600 hover:underline">
              Log in
            </Link>{" "}
            to write a review.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="text-slate-500">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-1 text-slate-600">{r.comment}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
