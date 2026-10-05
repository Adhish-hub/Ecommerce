import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import Stars from "./Stars";

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");

  const outOfStock = product.stock === 0;

  const handleAdd = async () => {
    if (!user) return navigate("/login");
    try {
      await addToCart(product._id, 1);
      setStatus("Added ✓");
    } catch (err) {
      setStatus(err.message);
    }
    setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      <Link to={`/products/${product._id}`}>
        {product.image?.url ? (
          <img
            src={product.image.url}
            alt={product.name}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to={`/products/${product._id}`}
          className="font-semibold text-slate-900 hover:text-brand-600"
        >
          {product.name}
        </Link>

        {product.category?.name && (
          <span className="text-xs text-slate-500">
            {product.category.name}
          </span>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            {formatPrice(product.price)}
          </span>
          {product.numReviews > 0 && (
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Stars value={product.averageRating} /> ({product.numReviews})
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="btn-primary mt-auto"
        >
          {outOfStock ? "Out of stock" : status || "Add to cart"}
        </button>
      </div>
    </div>
  );
}
