import React, { useEffect, useMemo, useState } from "react";
import { Users as UsersIcon, UserPlus, UserCheck, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!active) return;
        setUsers(Array.isArray(data) ? data : data.users || []);
      } catch (err) {
        console.error("Users fetch failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      active = false;
    };
  }, [token]);

  const filtered = users.filter((u) => {
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const totals = useMemo(() => {
    const totalUsers = users.length;
    const trainers = users.filter((u) => u.role === "trainer").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const employees = totalUsers - trainers - admins;
    return { totalUsers, trainers, admins, employees };
  }, [users]);

  const roleBreakdown = useMemo(() => {
    const base = totals.totalUsers || 1;
    return [
      {
        label: "Admins",
        value: totals.admins,
        width: `${Math.round((totals.admins / base) * 100)}%`,
        color: "bg-rose-500",
      },
      {
        label: "Trainers",
        value: totals.trainers,
        width: `${Math.round((totals.trainers / base) * 100)}%`,
        color: "bg-amber-500",
      },
      {
        label: "Employees",
        value: totals.employees,
        width: `${Math.round((totals.employees / base) * 100)}%`,
        color: "bg-emerald-500",
      },
    ];
  }, [totals]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-100 bg-white text-lg text-slate-500 shadow-sm">
        Loading users...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="admin-glow-card flex flex-col gap-6 rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Directory
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Search, filter, and orchestrate permissions.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search users..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-glow-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5">
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Users"
          value={totals.totalUsers}
          icon={<UsersIcon className="h-4 w-4" />}
          subtitle={`${totals.admins} admins · ${totals.trainers} trainers`}
        />
        <StatCard
          label="Dedicated Trainers"
          value={totals.trainers}
          icon={<UserCheck className="h-4 w-4" />}
          subtitle={`${totals.employees} employees partnered`}
        />
        <StatCard
          label="Administrators"
          value={totals.admins}
          icon={<UsersIcon className="h-4 w-4" />}
          subtitle="Full access custodians"
        />
      </div>

      {/* Table */}
      <div className="admin-glow-card overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">Email</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr key={u._id} className="border-t border-slate-100 bg-white/80 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {u.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      u.role === "admin"
                        ? "bg-red-100 text-red-600"
                        : u.role === "trainer"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="px-6 py-4 text-slate-600">{u.email}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
                  No users match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subtitle }) {
  return (
    <div className="admin-glow-card flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
    </div>
  );
}