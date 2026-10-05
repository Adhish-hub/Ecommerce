import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/Pagination";
import { formatPrice } from "../../utils/format";

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 10, sort: "-createdAt" });
    if (keyword) params.set("keyword", keyword);

    setLoading(true);
    api(`/products?${params}`, { raw: true })
      .then((res) => {
        setProducts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, keyword]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    try {
      await api(`/products/${p._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-3">
          <input
            className="input w-56"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link to="/admin/products/new" className="btn-primary">
            + New product
          </Link>
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
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3" />
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
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image?.url ? (
                        <img
                          src={p.image.url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-100" />
                      )}
                      <Link
                        to={`/products/${p._id}`}
                        className="font-medium hover:text-brand-600"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3">{formatPrice(p.price)}</td>
                  <td
                    className={`px-4 py-3 font-medium ${p.stock <= p.lowStockThreshold ? "text-red-600" : ""}`}
                  >
                    {p.stock}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/products/${p._id}/edit`}
                        className="btn-outline"
                      >
                        Edit
                      </Link>
                      {user.role === "admin" && (
                        <button
                          onClick={() => remove(p)}
                          className="btn-outline text-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
