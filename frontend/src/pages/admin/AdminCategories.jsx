import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatDate } from "../../utils/format";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () =>
    api("/categories")
      .then((c) => setCategories(Array.isArray(c) ? c : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api("/categories", { method: "POST", body: { name: newName } });
      setNewName("");
    });
  };

  const save = (id) =>
    run(async () => {
      await api(`/categories/${id}`, {
        method: "PUT",
        body: { name: editName },
      });
      setEditingId(null);
    });

  const remove = (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    run(() => api(`/categories/${c._id}`, { method: "DELETE" }));
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>

      <form onSubmit={add} className="mb-4 flex gap-3">
        <input
          className="input"
          placeholder="New category name (min 2 characters)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          minLength={2}
        />
        <button className="btn-primary whitespace-nowrap">Add category</button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="card divide-y divide-slate-200">
        {loading ? (
          <p className="p-4 text-slate-500">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="p-4 text-slate-500">No categories yet.</p>
        ) : (
          categories.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between gap-3 p-4"
            >
              {editingId === c._id ? (
                <>
                  <input
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => save(c._id)} className="btn-primary">
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-slate-400">
                      Added {formatDate(c.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(c._id);
                        setEditName(c.name);
                      }}
                      className="btn-outline"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => remove(c)}
                      className="btn-outline text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
