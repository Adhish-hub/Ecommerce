import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import StatusBadge from "../components/StatusBadge";
import { formatDate, formatPrice } from "../utils/format";
import { payWithRazorpay } from "../utils/razorpay";

const STEPS = ["placed", "processing", "shipped", "delivered"];

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { refreshCart } = useCart();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [paying, setPaying] = useState(false);

  const load = useCallback(
    () =>
      api(`/orders/${id}`)
        .then(setOrder)
        .catch((err) => setError(err.message)),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const pay = async () => {
    setError("");
    setNotice("");
    setPaying(true);
    try {
      const result = await payWithRazorpay(order._id, user);
      if (result === "paid") setNotice("Payment successful. Thank you!");
      await Promise.all([load(), refreshCart()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (error && !order) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-slate-500">Loading order…</p>;

  const cancelled = order.orderStatus === "cancelled";
  const stepIndex = STEPS.indexOf(order.orderStatus);
  const isOwner = order.user?._id === user?._id;
  const needsPayment =
    isOwner &&
    order.paymentMethod === "Razorpay" &&
    order.paymentStatus !== "paid" &&
    !cancelled;
  const a = order.shippingAddress;

  return (
    <div>
      <Link
        to="/orders"
        className="text-sm text-slate-500 hover:text-brand-600"
      >
        ← Back to orders
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-slate-500">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {notice && (
        <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {needsPayment && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            This order is waiting for payment of{" "}
            <strong>{formatPrice(order.totalPrice)}</strong>.
          </p>
          <button onClick={pay} disabled={paying} className="btn-primary">
            {paying ? "Opening…" : "Pay now"}
          </button>
        </div>
      )}

      {!cancelled && (
        <div className="card mb-6 p-6">
          <div className="flex items-center">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className="flex flex-1 items-center last:flex-none"
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      i <= stepIndex
                        ? "bg-brand-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className="text-xs capitalize text-slate-600">
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-0.5 flex-1 ${i < stepIndex ? "bg-brand-600" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card divide-y divide-slate-200 lg:col-span-2">
          {order.orderItems.map((item, i) => (
            <div
              key={item.product?._id || i}
              className="flex items-center gap-4 p-4"
            >
              {item.product?.image?.url ? (
                <img
                  src={item.product.image.url}
                  alt={item.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-slate-100" />
              )}
              <div className="flex-1">
                {item.product?._id ? (
                  <Link
                    to={`/products/${item.product._id}`}
                    className="font-medium hover:text-brand-600"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-medium">{item.name}</span>
                )}
                <p className="text-sm text-slate-500">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </section>

        <aside className="space-y-6">
          <section className="card space-y-2 p-6 text-sm">
            <h2 className="mb-2 text-lg font-bold">Summary</h2>
            <div className="flex justify-between text-slate-600">
              <span>Items</span>
              <span>{formatPrice(order.itemsPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>
                {order.shippingPrice === 0
                  ? "Free"
                  : formatPrice(order.shippingPrice)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            <p className="pt-2 text-slate-500">
              Payment:{" "}
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Razorpay"}
            </p>
          </section>

          <section className="card p-6 text-sm text-slate-600">
            <h2 className="mb-2 text-lg font-bold text-slate-800">
              Shipping to
            </h2>
            <p>{a.address}</p>
            <p>
              {a.city}, {a.postalCode}
            </p>
            <p>{a.country}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
