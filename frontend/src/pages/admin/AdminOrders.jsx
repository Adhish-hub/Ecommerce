import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, formatPrice } from "../../utils/format";

const ORDER_STATUSES = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ page, limit: 10 });
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);

    setLoading(true);
    api(`/orders/admin/all?${params}`)
      .then((res) => {
        setOrders(res.data || []);
        setTotalPages(res.totalPages || 1);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, status, paymentStatus]);

  const changeStatus = async (order, next) => {
    if (next === order.orderStatus) return;
    if (
      next === "cancelled" &&
      !window.confirm(
        "Cancel this order? Stock will be restored and this can't be undone.",
      )
    ) {
      return;
    }
    setError("");
    try {
      const updated = await api(`/orders/${order._id}/status`, {
        method: "PUT",
        body: { orderStatus: next },
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, orderStatus: updated.orderStatus } : o,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const filterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-3">
          <select
            className="input w-auto"
            value={status}
            onChange={filterChange(setStatus)}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={paymentStatus}
            onChange={filterChange(setPaymentStatus)}
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const locked =
                  o.orderStatus === "delivered" ||
                  o.orderStatus === "cancelled";
                return (
                  <tr key={o._id}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${o._id}`}
                        className="font-semibold hover:text-brand-600"
                      >
                        #{o._id.slice(-8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {formatDate(o.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{o.user?.name || "Deleted user"}</p>
                      <p className="text-xs text-slate-400">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(o.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.paymentStatus} />
                      <p className="mt-1 text-xs text-slate-400">
                        {o.paymentMethod}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="input w-auto capitalize"
                        value={o.orderStatus}
                        disabled={locked}
                        onChange={(e) => changeStatus(o, e.target.value)}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
