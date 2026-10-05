import { useEffect, useState } from "react";
import { api } from "../api/client";
import ProductCard from "../components/ProductCard";

const SORTS = [
  { value: "-createdAt", label: "Newest" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Wait for the user to stop typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams({ page, limit: 8, sort });
    if (keyword) params.set("keyword", keyword);
    if (category) params.set("category", category);

    setLoading(true);
    api(`/products?${params}`, { raw: true })
      .then((res) => {
        setProducts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, keyword, category, sort]);

  const pickCategory = (id) => {
    setCategory(id);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-3">
          <input
            className="input sm:w-64"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-auto"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[{ _id: "", name: "All" }, ...categories].map((c) => (
          <button
            key={c._id}
            onClick={() => pickCategory(c._id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === c._id
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-slate-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            className="btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
