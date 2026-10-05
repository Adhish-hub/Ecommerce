import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

export default function Wishlist() {
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/wishlist")
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    setError("");
    try {
      await api(`/wishlist/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const moveToCart = async (id) => {
    setError("");
    try {
      await addToCart(id, 1);
      await remove(id);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading wishlist…</p>;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-lg text-slate-500">Your wishlist is empty.</p>
        <Link to="/" className="btn-primary">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your wishlist</h1>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <div key={p._id} className="card flex flex-col overflow-hidden">
            <Link to={`/products/${p._id}`}>
              {p.image?.url ? (
                <img
                  src={p.image.url}
                  alt={p.name}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-400">
                  No image
                </div>
              )}
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <Link
                to={`/products/${p._id}`}
                className="font-semibold hover:text-brand-600"
              >
                {p.name}
              </Link>
              <span className="text-lg font-bold">{formatPrice(p.price)}</span>
              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => moveToCart(p._id)}
                  className="btn-primary flex-1"
                >
                  Move to cart
                </button>
                <button
                  onClick={() => remove(p._id)}
                  className="btn-outline"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
