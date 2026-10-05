import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/format";

const ROLES = ["customer", "seller", "admin"];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () =>
    api("/users")
      .then((u) => setUsers(Array.isArray(u) ? u : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (u, role) => {
    if (role === u.role) return;
    if (!window.confirm(`Change ${u.name}'s role to ${role}?`)) return;
    setError("");
    try {
      await api(`/users/${u._id}`, { method: "PUT", body: { role } });
      setUsers((prev) =>
        prev.map((x) => (x._id === u._id ? { ...x, role } : x)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This can't be undone.`))
      return;
    setError("");
    try {
      await api(`/users/${u._id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Users</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
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
            ) : (
              users.map((u) => {
                const isMe = u._id === me._id;
                return (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium">
                      {u.name}{" "}
                      {isMe && (
                        <span className="text-xs text-slate-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="input w-auto capitalize"
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(u)}
                        disabled={isMe}
                        className="btn-outline text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
