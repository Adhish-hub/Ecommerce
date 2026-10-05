import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

export default function Cart() {
  const { items, loading, total, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const [error, setError] = useState("");

  // Only render items where the product details came back with the cart
  const rows = items.filter((i) => i.product && typeof i.product === "object");

  const run = async (fn) => {
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && rows.length === 0)
    return <p className="text-slate-500">Loading cart…</p>;

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-lg text-slate-500">Your cart is empty.</p>
        <Link to="/" className="btn-primary">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <button
          onClick={() => run(clearCart)}
          className="text-sm text-red-600 hover:underline"
        >
          Clear cart
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {rows.map(({ product, quantity }) => (
            <div key={product._id} className="card flex items-center gap-4 p-4">
              {product.image?.url ? (
                <img
                  src={product.image.url}
                  alt={product.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-slate-100" />
              )}

              <div className="flex-1">
                <Link
                  to={`/products/${product._id}`}
                  className="font-semibold hover:text-brand-600"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {formatPrice(product.price)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn-outline px-3"
                  disabled={quantity <= 1}
                  onClick={() =>
                    run(() => updateQuantity(product._id, quantity - 1))
                  }
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  className="btn-outline px-3"
                  disabled={
                    product.stock !== undefined && quantity >= product.stock
                  }
                  onClick={() =>
                    run(() => updateQuantity(product._id, quantity + 1))
                  }
                >
                  +
                </button>
              </div>

              <p className="w-24 text-right font-semibold">
                {formatPrice(product.price * quantity)}
              </p>

              <button
                onClick={() => run(() => removeFromCart(product._id))}
                className="text-slate-400 hover:text-red-600"
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="card h-fit space-y-4 p-6">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link to="/checkout" className="btn-primary w-full">
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
