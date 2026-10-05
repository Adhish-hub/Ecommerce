import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../utils/format";

function StatCard({ label, value, accent = "text-slate-900" }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/orders/admin/stats"), api("/products/low-stock")])
      .then(([s, low]) => {
        setStats(s);
        setLowStock(low.data || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-slate-500">Loading dashboard…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue (paid orders)"
          value={formatPrice(stats.totalRevenue)}
          accent="text-brand-600"
        />
        <StatCard label="Total orders" value={stats.totalOrders} />
        <StatCard
          label="Awaiting payment"
          value={stats.pendingPayments}
          accent="text-amber-600"
        />
        <StatCard
          label="Paid orders"
          value={stats.paidOrders}
          accent="text-emerald-600"
        />
        <StatCard label="Placed" value={stats.pendingOrders} />
        <StatCard label="Processing" value={stats.processingOrders} />
        <StatCard label="Shipped" value={stats.shippedOrders} />
        <StatCard
          label="Delivered"
          value={stats.deliveredOrders}
          accent="text-emerald-600"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Low stock</h2>
          <span className="text-sm text-slate-500">
            {lowStock.length} product{lowStock.length === 1 ? "" : "s"}
          </span>
        </div>

        {lowStock.length === 0 ? (
          <p className="card p-4 text-sm text-slate-500">
            Everything is well stocked.
          </p>
        ) : (
          <div className="card divide-y divide-slate-200">
            {lowStock.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-slate-500">
                    {p.category?.name || "Uncategorized"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-semibold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                  <Link
                    to={`/admin/products/${p._id}/edit`}
                    className="btn-outline"
                  >
                    Restock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  // Sellers have no dashboard; send them to their products
  if (user.role !== "admin") return <Navigate to="/admin/products" replace />;
  return <AdminDashboard />;
}
