import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "",
  lowStockThreshold: "5",
};
const MAX_SIZE = 2 * 1024 * 1024;

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [currentImage, setCurrentImage] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/categories")
      .then((c) => setCategories(Array.isArray(c) ? c : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api(`/products/${id}`)
      .then((p) => {
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          category: p.category?._id || p.category || "",
          stock: String(p.stock),
          lowStockThreshold: String(p.lowStockThreshold),
        });
        setCurrentImage(p.image?.url || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      return setError("Only JPG, PNG or WEBP images are allowed.");
    }
    if (f.size > MAX_SIZE) return setError("Image must be 2 MB or smaller.");
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (file) body.append("image", file);

    try {
      await api(isEdit ? `/products/${id}` : "/products", {
        method: isEdit ? "PUT" : "POST",
        body,
      });
      navigate("/admin/products");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const shownImage = preview || currentImage;

  return (
    <div className="max-w-2xl">
      <Link
        to="/admin/products"
        className="text-sm text-slate-500 hover:text-brand-600"
      >
        ← Back to products
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold">
        {isEdit ? "Edit product" : "New product"}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            className="input"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={2}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            className="input"
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Price (₹)</label>
            <input
              className="input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              className="input"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Stock</label>
            <input
              className="input"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Low-stock alert at
            </label>
            <input
              className="input"
              name="lowStockThreshold"
              type="number"
              min="0"
              step="1"
              value={form.lowStockThreshold}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Image {isEdit && "(leave empty to keep current)"}
          </label>
          {shownImage && (
            <img
              src={shownImage}
              alt="Preview"
              className="mb-3 h-40 w-40 rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="block text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">
            JPG, PNG or WEBP, up to 2 MB.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
          <Link to="/admin/products" className="btn-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
