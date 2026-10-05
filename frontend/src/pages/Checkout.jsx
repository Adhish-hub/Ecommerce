import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import { payWithRazorpay } from "../utils/razorpay";

// Mirrors the backend rule; the server calculates the real amount
const shippingFor = (subtotal) => (subtotal >= 1000 ? 0 : 100);

export default function Checkout() {
  const { user } = useAuth();
  const { items, loading, total, refreshCart } = useCart();
  const navigate = useNavigate();

  const idempotencyKey = useRef(crypto.randomUUID());
  const [form, setForm] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "India",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const rows = items.filter((i) => i.product && typeof i.product === "object");
  const shipping = shippingFor(total);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);

    let order;
    try {
      order = await api("/orders", {
        method: "POST",
        body: { shippingAddress: form, paymentMethod },
        headers: { "Idempotency-Key": idempotencyKey.current },
      });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
      return;
    }

    let notice = "Order placed successfully!";

    if (paymentMethod === "Razorpay") {
      try {
        const result = await payWithRazorpay(order._id, user);
        notice =
          result === "paid"
            ? "Payment successful. Thank you!"
            : "Order placed, but payment isn't complete yet. You can pay below.";
      } catch (err) {
        notice = `Order placed, but the payment didn't go through: ${err.message}`;
      }
    }

    await refreshCart();
    navigate(`/orders/${order._id}`, { replace: true, state: { notice } });
  };

  if (rows.length === 0 && !placing) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-lg text-slate-500">
          {loading ? "Loading…" : "Your cart is empty."}
        </p>
        {!loading && (
          <Link to="/" className="btn-primary">
            Browse products
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-bold">Shipping address</h2>
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <input
              className="input"
              name="address"
              placeholder="Street address"
              value={form.address}
              onChange={handleChange}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="input"
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                required
              />
              <input
                className="input"
                name="postalCode"
                placeholder="Postal code"
                value={form.postalCode}
                onChange={handleChange}
                required
              />
            </div>
            <input
              className="input"
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              required
            />
          </section>

          <section className="card space-y-3 p-6">
            <h2 className="text-lg font-bold">Payment method</h2>
            {[
              {
                value: "COD",
                label: "Cash on delivery",
                hint: "Pay when your order arrives",
              },
              {
                value: "Razorpay",
                label: "Pay online",
                hint: "Cards, UPI, netbanking via Razorpay",
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  paymentMethod === opt.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="mt-1"
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                />
                <span>
                  <span className="block font-medium">{opt.label}</span>
                  <span className="text-sm text-slate-500">{opt.hint}</span>
                </span>
              </label>
            ))}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6">
          <h2 className="text-lg font-bold">Order summary</h2>

          <ul className="space-y-2 text-sm">
            {rows.map(({ product, quantity }) => (
              <li key={product._id} className="flex justify-between gap-2">
                <span className="text-slate-600">
                  {product.name} × {quantity}
                </span>
                <span>{formatPrice(product.price * quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(total + shipping)}</span>
            </div>
          </div>

          <button className="btn-primary w-full" disabled={placing}>
            {placing
              ? "Placing order…"
              : paymentMethod === "COD"
                ? "Place order"
                : "Place order & pay"}
          </button>
        </aside>
      </form>
    </div>
  );
}
