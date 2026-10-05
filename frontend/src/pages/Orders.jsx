import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { formatDate, formatPrice } from "../utils/format";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders/myorders")
      .then((res) => setOrders(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading orders…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-lg text-slate-500">
          You haven't placed any orders yet.
        </p>
        <Link to="/" className="btn-primary">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your orders</h1>

      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o._id}
            to={`/orders/${o._id}`}
            className="card block p-4 transition hover:border-brand-500"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  #{o._id.slice(-8).toUpperCase()}
                </p>
                <p className="text-sm text-slate-500">
                  {formatDate(o.createdAt)} · {o.orderItems.length} item
                  {o.orderItems.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={o.orderStatus} />
                <StatusBadge status={o.paymentStatus} />
              </div>

              <p className="text-lg font-bold">{formatPrice(o.totalPrice)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
